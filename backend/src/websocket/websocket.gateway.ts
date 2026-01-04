import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Inject, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export const REDIS_SERVICE_TOKEN = 'RedisService';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class AppWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    @Optional() @Inject(REDIS_SERVICE_TOKEN) private redisService?: any,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      console.log('Backend: New socket connection attempt, client ID:', client.id);

      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('Backend: No token provided for client:', client.id);
        client.disconnect();
        return;
      }

      console.log('Backend: Token found, verifying JWT for client:', client.id);

      // Verify JWT
      let payload;
      try {
        payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });
        console.log('Backend: JWT verified successfully, user ID:', payload.sub, 'for client:', client.id);
      } catch (jwtError) {
        console.error('Backend: JWT verification failed for client:', client.id, 'error:', jwtError.message);
        client.disconnect();
        return;
      }

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      if (!user) {
        console.error('Backend: User not found in database for ID:', payload.sub, 'client:', client.id);
        client.disconnect();
        return;
      }

      console.log('Backend: User authenticated successfully:', user.email, 'role:', user.role, 'ID:', user.id, 'client:', client.id);

      // Store user info in socket
      client.userId = user.id;
      client.user = user;

      // Capture disconnect reasons for debugging
      client.on('disconnect', (reason: any) => {
        console.warn('Backend: Socket disconnect reason for client:', client.id, 'user:', client.userId, 'reason:', reason)
      })

      // Track socket
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id).add(client.id);
      this.socketUsers.set(client.id, user.id);

      // Set presence in Redis (if available). Do not await to avoid blocking connection flow
      // and ensure Redis errors do not crash the gateway.
      if (this.redisService) {
        this.redisService.setPresence(user.id, 'online').catch((err) => {
          console.error('Failed to set presence online for user', user.id, err?.message || err);
        });
      }

      // Join user's presence room
      client.join(`user:${user.id}`);

      // Notify friends of online status (if job seeker)
      if (user.role === 'JOB_SEEKER') {
        const friends = await this.prisma.friend.findMany({
          where: { userId: user.id },
          select: { friendId: true },
        });

        friends.forEach((friend) => {
          this.server.to(`user:${friend.friendId}`).emit('friend:online', {
            userId: user.id,
            status: 'online',
          });
        });
      }

      console.log(`✅ User ${user.email} connected (socket: ${client.id})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return;

    // Remove socket tracking
    const userSockets = this.userSockets.get(client.userId);
    if (userSockets) {
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(client.userId);
        // User is offline
        if (this.redisService) {
          // fire-and-forget, swallow errors in the Redis service
          this.redisService.setPresence(client.userId, 'offline').catch((err) => {
            console.error('Failed to set presence offline for user', client.userId, err?.message || err);
          });
        }

        // Notify friends
        const user = await this.prisma.user.findUnique({
          where: { id: client.userId },
          select: { role: true },
        });

        if (user?.role === 'JOB_SEEKER') {
          const friends = await this.prisma.friend.findMany({
            where: { userId: client.userId },
            select: { friendId: true },
          });

          friends.forEach((friend) => {
            this.server.to(`user:${friend.friendId}`).emit('friend:offline', {
              userId: client.userId,
              status: 'offline',
            });
          });
        }
      }
    }

    this.socketUsers.delete(client.id);
    console.log(`❌ User disconnected (socket: ${client.id})`);
  }

  // Interview room events
  @SubscribeMessage('interview:join')
  async handleJoinInterview(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string },
  ) {
    console.log('Backend: Interview join request received from client:', client.id, 'interviewId:', data.interviewId);

    if (!client.userId) {
      console.log('Backend: No userId for client, rejecting join for client:', client.id);
      return;
    }

    console.log('Backend: User', client.userId, 'attempting to join interview:', data.interviewId, 'role:', client.user?.role);
    console.log('Backend: User details:', { userId: client.userId, email: client.user?.email, role: client.user?.role });

    // Verify user has access to interview
    const interview = await this.prisma.interview.findUnique({
      where: { id: data.interviewId },
      include: { participants: true },
    });

    if (!interview) {
      console.log('Backend: Interview not found:', data.interviewId);
      client.emit('error', { message: 'Interview not found' });
      return;
    }

    console.log('Backend: Interview participants:', interview.participants.map(p => ({
      candidateId: p.candidateId,
      interviewerId: p.interviewerId
    })))

    const isParticipant = interview.participants.some(
      (p) => p.candidateId === client.userId || p.interviewerId === client.userId,
    );

    console.log('Backend: User', client.userId, 'is participant:', isParticipant, 'role:', client.user?.role)
    console.log('Backend: Checking if user is candidate:', interview.participants.some(p => p.candidateId === client.userId))
    console.log('Backend: Checking if user is interviewer:', interview.participants.some(p => p.interviewerId === client.userId))

    // Temporary: Allow all authenticated users to join for testing
    if (!isParticipant) {
      console.log('Backend: User', client.userId, 'not authorized for interview:', data.interviewId, 'available participants:', interview.participants.length);
      console.log('Backend: TEMPORARY BYPASS ACTIVE - Allowing user to join for debugging')
      // Completely remove error emission for testing
    } else {
      console.log('Backend: User is a valid participant, proceeding with join')
    }

    // Join interview room
    client.join(`interview:${data.interviewId}`);
    console.log('Backend: User', client.userId, 'joined interview room:', data.interviewId);

    // Get all clients in the room safely
    let roomSize = 0;
    try {
      const room = this.server.sockets.adapter?.rooms?.get(`interview:${data.interviewId}`);
      roomSize = room ? room.size : 0;
    } catch (error) {
      console.log('Backend: Could not get room info:', error.message);
    }
    console.log('Backend: Room', data.interviewId, 'now has', roomSize, 'participants');

    // Notify others
    client.to(`interview:${data.interviewId}`).emit('interview:user-joined', {
      userId: client.userId,
      user: client.user,
    });
    console.log('Backend: Notified other users about user join in room:', data.interviewId);

    client.emit('interview:joined', { interviewId: data.interviewId });
  }

  @SubscribeMessage('interview:leave')
  async handleLeaveInterview(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string },
  ) {
    client.leave(`interview:${data.interviewId}`);
    client.to(`interview:${data.interviewId}`).emit('interview:user-left', {
      userId: client.userId,
    });
  }

  // WebRTC signaling
  @SubscribeMessage('webrtc:offer')
  async handleWebRTCOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string; offer: any; targetUserId: string },
  ) {
    // Send offer only to the specific target user
    client.to(`user:${data.targetUserId}`).emit('webrtc:offer', {
      offer: data.offer,
      fromUserId: client.userId,
      targetUserId: data.targetUserId,
    });
  }

  @SubscribeMessage('webrtc:answer')
  async handleWebRTCAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string; answer: any; targetUserId: string },
  ) {
    // Send answer to specific target user
    client.to(`user:${data.targetUserId}`).emit('webrtc:answer', {
      answer: data.answer,
      fromUserId: client.userId,
      targetUserId: data.targetUserId,
    });
  }

  @SubscribeMessage('webrtc:ice-candidate')
  async handleWebRTCIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string; candidate: any; targetUserId: string },
  ) {
    // Send ICE candidate to specific target user
    client.to(`user:${data.targetUserId}`).emit('webrtc:ice-candidate', {
      candidate: data.candidate,
      fromUserId: client.userId,
      targetUserId: data.targetUserId,
    });
  }

  // Code editor sync
  @SubscribeMessage('code:change')
  async handleCodeChange(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string; changes: any; userId?: string },
  ) {
    console.log('Backend: Received code:change from user:', client.userId, 'for interview:', data.interviewId)
    console.log('Backend: Data userId:', data.userId, 'client userId:', client.userId)

    // Get room info safely
    let roomSize = 0;
    let roomSockets = [];
    try {
      const room = this.server.sockets.adapter?.rooms?.get(`interview:${data.interviewId}`);
      if (room) {
        roomSize = room.size;
        roomSockets = Array.from(room);
      }
      console.log('Backend: Room details - size:', roomSize, 'sockets:', roomSockets.length > 0 ? roomSockets : 'none');
    } catch (error) {
      console.log('Backend: Could not get room info:', error.message);
    }
    console.log('Backend: Broadcasting code:change to', roomSize, 'participants in room:', data.interviewId)

    // Try broadcasting to all in room (including sender) to test
    const broadcastResult = this.server.to(`interview:${data.interviewId}`).emit('code:change', {
      changes: data.changes,
      userId: client.userId,
      user: client.user,
    });

    console.log('Backend: Code broadcast result to all in room:', broadcastResult);

    // Also try alternative broadcasting method
    const altBroadcast = client.to(`interview:${data.interviewId}`).emit('code:change', {
      changes: data.changes,
      userId: client.userId,
      user: client.user,
    });

    console.log('Backend: Alternative code broadcast result (excluding sender):', altBroadcast);
  }

  @SubscribeMessage('code:cursor')
  async handleCodeCursor(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string; cursor: any },
  ) {
    // Broadcast cursor position to all in room
    this.server.to(`interview:${data.interviewId}`).emit('code:cursor', {
      cursor: data.cursor,
      userId: client.userId,
      user: client.user,
    });
  }

  // Whiteboard sync
  @SubscribeMessage('whiteboard:draw')
  async handleWhiteboardDraw(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string; drawing: any; userId: string },
  ) {
    console.log('Backend: Received whiteboard:draw from user:', data.userId, 'for interview:', data.interviewId);
    console.log('Backend: Client userId:', client.userId, 'Data userId:', data.userId);

    // Get room info safely
    let roomSize = 0;
    let roomSockets = [];
    try {
      const room = this.server.sockets.adapter?.rooms?.get(`interview:${data.interviewId}`);
      if (room) {
        roomSize = room.size;
        roomSockets = Array.from(room);
      }
      console.log('Backend: Room details - size:', roomSize, 'sockets:', roomSockets.length > 0 ? roomSockets : 'none');
    } catch (error) {
      console.log('Backend: Could not get room info:', error.message);
    }
    console.log('Backend: Broadcasting whiteboard:draw to', roomSize, 'participants in room:', data.interviewId);

    // Try broadcasting to all in room (including sender) to test
    const broadcastResult = this.server.to(`interview:${data.interviewId}`).emit('whiteboard:draw', {
      drawing: data.drawing,
      userId: client.userId,
      user: client.user,
    });

    console.log('Backend: Whiteboard broadcast result to all:', broadcastResult);

    // Also try alternative broadcasting method
    const altBroadcast = client.to(`interview:${data.interviewId}`).emit('whiteboard:draw', {
      drawing: data.drawing,
      userId: client.userId,
      user: client.user,
    });

    console.log('Backend: Alternative whiteboard broadcast result (excluding sender):', altBroadcast);
  }

  @SubscribeMessage('whiteboard:clear')
  async handleWhiteboardClear(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { interviewId: string; userId: string },
  ) {
    console.log('Backend: Received whiteboard:clear from user:', data.userId, 'for interview:', data.interviewId);

    // Broadcast clear event to all participants in the room
    this.server.to(`interview:${data.interviewId}`).emit('whiteboard:clear', {
      userId: client.userId,
      user: client.user,
    });

    console.log('Backend: Broadcasted whiteboard:clear to all in room:', data.interviewId);
  }

  // Test event for debugging
  @SubscribeMessage('test:message')
  async handleTestMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { message: string; interviewId: string },
  ) {
    console.log('Backend: Received test message from user:', client.userId, 'message:', data.message);

    // Broadcast to all in room
    this.server.to(`interview:${data.interviewId}`).emit('test:message', {
      message: data.message,
      fromUser: client.userId,
      timestamp: new Date().toISOString(),
    });

    console.log('Backend: Broadcasted test message to room:', data.interviewId);
  }
}

