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
  if (existingSocket) {
    // If connected, return it
    if (existingSocket.connected) {
      // console.log('Socket: Returning existing connected socket for token:', token.substring(0, 10) + '...');
      return existingSocket;
    }

    // If explicitly disconnected, clean it up
    if (existingSocket.disconnected) {
      // console.log('Socket: Found disconnected socket, cleaning up and creating new one:', token.substring(0, 10) + '...');
      existingSocket.removeAllListeners(); // Clean up listeners
      socketMap.delete(token);
    } else {
      // Socket exists but is not connected yet (likely connecting)
      // Return it to avoid creating duplicates
      // console.log('Socket: Returning existing socket (connecting) for token:', token.substring(0, 10) + '...');
      return existingSocket;
    }
  }

  console.log('Socket: Creating new socket connection for token:', token.substring(0, 10) + '...');
  const socket = io(WS_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'], // Allow fallback to polling
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  // Add connection state logging
  socket.on('connect', () => {
    console.log('Socket: Connected successfully, id:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket: Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket: Disconnected, reason:', reason);
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
