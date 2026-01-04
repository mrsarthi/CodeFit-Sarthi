import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import crypto from 'crypto';

const BACKEND_API = process.env.BACKEND_API || 'http://localhost:3001/api';
const INTERVIEW_ID = process.env.INTERVIEW_ID || 'smoke-test-interview';

async function registerAndLogin() {
  const email = `smoke+${Date.now()}@example.com`;
  const password = 'Password123!';
  // register
  await axios.post(`${BACKEND_API}/auth/register`, {
    email,
    password,
    firstName: 'Smoke',
    lastName: 'Test',
    role: 'JOB_SEEKER',
  });

  // login
  const res = await axios.post(`${BACKEND_API}/auth/login`, {
    email,
    password,
  });
  return res.data.accessToken;
}

function connectSocket(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });

    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
    // timeout
    setTimeout(() => reject(new Error('Socket connect timed out')), 5000);
  });
}

(async () => {
  try {
    console.log('Smoke: Registering and logging in test user...');
    const token = await registerAndLogin();
    console.log('Smoke: Got token, connecting two sockets...');

    const s1 = await connectSocket(token);
    const s2 = await connectSocket(token);

    // Prepare listener on s2
    const received = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Did not receive test message')), 5000);
      s2.on('test:message', (data: any) => {
        clearTimeout(timer);
        console.log('Smoke: s2 received test:message', data);
        resolve();
      });
    });

    // Join room
    s1.emit('interview:join', { interviewId: INTERVIEW_ID });
    s2.emit('interview:join', { interviewId: INTERVIEW_ID });

    // Small delay to ensure server processed joins
    await new Promise((r) => setTimeout(r, 500));

    // Emit test message from s1
    console.log('Smoke: Emitting test:message from s1...');
    s1.emit('test:message', { message: 'smoke-test', interviewId: INTERVIEW_ID });

    await received;
    console.log('Smoke: Success - s2 received the message');

    s1.disconnect();
    s2.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Smoke: Test failed:', err?.message || err);
    process.exit(1);
  }
})();