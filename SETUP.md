# CodeFit Setup Guide

Complete setup instructions for running the CodeFit technical interview platform locally.

## Prerequisites

- Node.js 18+ and npm/yarn
- MySQL 8+
- Redis 6+
- Git

## Step 1: Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 2: Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE codefit;
```

2. Configure backend environment:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/codefit?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

3. Run Prisma migrations:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## Step 3: Redis Setup

Make sure Redis is running:
```bash
# On macOS with Homebrew
brew services start redis

# On Linux
sudo systemctl start redis

# On Windows (using WSL or Docker)
redis-server
```

## Step 4: Frontend Setup

1. Configure frontend environment:
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Step 5: Run the Application

### Terminal 1 - Backend
```bash
cd backend
npm run start:dev
```

Backend will run on http://localhost:3001

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Frontend will run on http://localhost:3000

## Step 6: Create Test Users

1. Open http://localhost:3000/register
2. Create a user with role "Job Seeker"
3. Create another user with role "Interviewer"
4. Log in with either account

## Features to Test

### As Interviewer:
1. Create an interview from dashboard
2. Add job seeker as participant
3. Join interview room
4. Test video/audio controls
5. Use code editor and whiteboard

### As Job Seeker:
1. View scheduled interviews
2. Join interview room
3. Send friend requests to other job seekers
4. See online/offline status of friends
5. Collaborate in real-time code editor

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check DATABASE_URL in `.env` matches your MySQL credentials
- Ensure database exists: `SHOW DATABASES;`

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_HOST and REDIS_PORT in backend `.env`

### WebRTC Issues
- Ensure HTTPS in production (or use localhost for development)
- Check browser permissions for camera/microphone
- Verify STUN server is accessible

### Socket.IO Issues
- Check CORS settings in backend
- Verify FRONTEND_URL matches your frontend URL
- Check browser console for connection errors

## Production Deployment

### Backend (NestJS)
- Set NODE_ENV=production
- Use strong JWT secrets
- Configure proper CORS origins
- Use environment-specific database URLs
- Set up proper logging

### Frontend (Next.js)
- Build: `npm run build`
- Start: `npm start`
- Or deploy to Vercel/Netlify

### Database
- Use managed MySQL service (AWS RDS, Google Cloud SQL)
- Set up regular backups
- Configure connection pooling

### Redis
- Use managed Redis (AWS ElastiCache, Redis Cloud)
- Configure persistence
- Set up monitoring

## Architecture Notes

- **Backend**: NestJS REST API + Socket.IO WebSocket server
- **Frontend**: Next.js 14 with App Router
- **Database**: MySQL with Prisma ORM
- **Real-time**: Socket.IO for code editor, whiteboard, presence
- **Video**: WebRTC peer-to-peer (can upgrade to SFU like mediasoup for scale)
- **State Management**: Zustand for client state

## Next Steps

- Add ML cheating detection service
- Implement SFU for WebRTC scaling
- Add interview recording
- Implement chat feature
- Add interview feedback system

