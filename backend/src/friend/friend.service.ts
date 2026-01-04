import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendRequestStatus } from '@prisma/client';

@Injectable()
export class FriendService {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(senderId: string, receiverId: string) {
    // Check if sender is job seeker
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });

    if (sender.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Only job seekers can send friend requests');
    }

    // Check if receiver is job seeker
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    if (receiver.role !== 'JOB_SEEKER') {
      throw new ForbiddenException('Can only send friend requests to job seekers');
    }

    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if already friends
    const existingFriend = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
    });

    if (existingFriend) {
      throw new BadRequestException('Already friends');
    }

    // Check if request already exists
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new BadRequestException('Friend request already pending');
      }
      if (existingRequest.status === 'ACCEPTED') {
        throw new BadRequestException('Already friends');
      }
    }

    // Create friend request
    const friendRequest = await this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return friendRequest;
  }

  async getFriendRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  }

  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenException('You can only accept requests sent to you');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    // Use transaction to update request and create friend relationship
    const result = await this.prisma.$transaction(async (tx) => {
      // Update request status
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: FriendRequestStatus.ACCEPTED },
      });

      // Create bidirectional friend relationship
      await tx.friend.createMany({
        data: [
          { userId: request.senderId, friendId: request.receiverId },
          { userId: request.receiverId, friendId: request.senderId },
        ],
        skipDuplicates: true,
      });

      return tx.friendRequest.findUnique({
        where: { id: requestId },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          receiver: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    return result;
  }

  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenException('You can only reject requests sent to you');
    }

    const updated = await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: FriendRequestStatus.REJECTED },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  async getFriends(userId: string) {
    const friends = await this.prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return friends.map((f) => f.friend);
  }
}

