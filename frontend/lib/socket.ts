import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Map to store sockets per user/token to avoid conflicts
const socketMap = new Map<string, Socket>();

export const getSocket = (token: string): Socket => {
  if (!token) {
    throw new Error('No authentication token provided');
  }

  // Check if we already have a socket for this token
  const existingSocket = socketMap.get(token);
  if (existingSocket?.connected) {
    console.log('Socket: Returning existing connected socket for token:', token.substring(0, 10) + '...');
    return existingSocket;
  }

  // Disconnect existing socket if it's not connected
  if (existingSocket && !existingSocket.connected) {
    console.log('Socket: Disconnecting stale socket for token:', token.substring(0, 10) + '...');
    existingSocket.disconnect();
    socketMap.delete(token);
  }

  console.log('Socket: Creating new socket connection for token:', token.substring(0, 10) + '...');
  const socket = io(WS_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
    forceNew: true, // Force new connection
  });

  // Store the socket
  socketMap.set(token, socket);

  return socket;
};

export const disconnectSocket = (token?: string) => {
  if (token) {
    const socket = socketMap.get(token);
    if (socket) {
      console.log('Socket: Disconnecting socket for token:', token.substring(0, 10) + '...');
      socket.disconnect();
      socketMap.delete(token);
    }
  } else {
    // Disconnect all sockets
    console.log('Socket: Disconnecting all sockets');
    socketMap.forEach((socket, token) => {
      socket.disconnect();
    });
    socketMap.clear();
  }
};

