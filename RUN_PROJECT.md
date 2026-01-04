# How to Run CodeFit Project

Complete step-by-step guide to run the CodeFit technical interview platform.

## Prerequisites Checklist

Before running, ensure you have:

- ✅ Node.js 18+ installed (`node --version`)
- ✅ MySQL 8+ installed and running
- ✅ Redis installed and running
- ✅ Database `codefit` created
- ✅ Backend `.env` file configured
- ✅ Frontend `.env.local` file configured

## Step-by-Step Run Guide

### Step 1: Verify Prerequisites

**Check MySQL:**
```bash
mysql -u root -p
# Enter your password, then:
SHOW DATABASES;
# Should see 'codefit' database
EXIT;
```

**Check Redis:**
```bash
redis-cli ping
# Should return: PONG
```

If Redis is not running, start it:
```bash
# Docker (easiest)
docker run -d -p 6379:6379 --name codefit-redis redis:latest

# Or start your local Redis service
```

### Step 2: Setup Backend Database

```bash
# Navigate to backend
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to verify database
npx prisma studio
# This opens http://localhost:5555 in your browser
```

### Step 3: Start Backend Server

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Expected output:**
```
🚀 Backend server running on http://localhost:3001
[Nest] Application successfully started
```

**If you see errors:**
- Database connection error → Check MySQL is running and `.env` DATABASE_URL is correct
- Redis connection error → Check Redis is running
- Port 3001 already in use → Change PORT in `.env` or stop the process using port 3001

### Step 4: Start Frontend Server

**Terminal 2 - Frontend (Open a NEW terminal):**
```bash
cd frontend
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

### Step 5: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

You should see the CodeFit landing page!

## Quick Start Commands

**All-in-one script (copy and paste):**

```bash
# Terminal 1 - Backend
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev

# Terminal 2 - Frontend (new terminal window)
cd frontend
npm run dev
```

## First Time Setup

### 1. Create Database

```sql
mysql -u root -p
CREATE DATABASE codefit;
EXIT;
```

### 2. Configure Backend `.env`

Create `backend/.env`:
```env
DATABASE_URL="mysql://root:YourPassword@localhost:3306/codefit?schema=public"
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

### 3. Configure Frontend `.env.local`

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 4. Install Dependencies (if not done)

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## Running the Project

### Development Mode

**Backend:**
```bash
cd backend
npm run start:dev
# Auto-reloads on file changes
```

**Frontend:**
```bash
cd frontend
npm run dev
# Auto-reloads on file changes
```

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## Testing the Application

### 1. Create Test Users

1. Go to: http://localhost:3000/register
2. Create a **Job Seeker** account:
   - Email: `candidate@test.com`
   - Password: `password123`
   - Role: Job Seeker
3. Create an **Interviewer** account:
   - Email: `interviewer@test.com`
   - Password: `password123`
   - Role: Interviewer

### 2. Test Features

**As Interviewer:**
1. Login at http://localhost:3000/login
2. Go to Dashboard
3. Click "Create Interview"
4. Search for the candidate user
5. Add candidate and create interview
6. Click "Join Interview" to test the interview room

**As Job Seeker:**
1. Login with candidate account
2. View scheduled interviews on dashboard
3. Click "Join Interview"
4. Test:
   - Video/audio controls
   - Code editor (type code, see real-time sync)
   - Whiteboard (draw, see real-time sync)
5. Go to Friends page to add other job seekers

## Common Issues & Solutions

### Backend won't start

**Error: "Can't reach database server"**
```bash
# Check MySQL is running
mysql -u root -p

# Verify DATABASE_URL in backend/.env
# Format: mysql://username:password@host:port/database
```

**Error: "Redis connection failed"**
```bash
# Start Redis
docker run -d -p 6379:6379 --name codefit-redis redis:latest

# Or verify local Redis
redis-cli ping
```

**Error: "Port 3001 already in use"**
```bash
# Windows: Find and kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3001 | xargs kill
```

### Frontend won't start

**Error: "Port 3000 already in use"**
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill
```

**Error: "Cannot connect to API"**
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Check browser console for CORS errors

### Database Migration Errors

**Error: "Migration failed"**
```bash
cd backend
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create fresh migration
npx prisma migrate dev --name init
```

## Project Structure While Running

```
Terminal 1 (Backend):
├── Backend API: http://localhost:3001
├── WebSocket: ws://localhost:3001
└── API Docs: http://localhost:3001/api

Terminal 2 (Frontend):
└── Frontend: http://localhost:3000

Browser:
├── Landing: http://localhost:3000
├── Login: http://localhost:3000/login
├── Register: http://localhost:3000/register
└── Dashboard: http://localhost:3000/dashboard
```

## Useful Commands

**Backend:**
```bash
npm run start:dev      # Development with hot reload
npm run build          # Build for production
npm run start:prod     # Run production build
npx prisma studio      # Open database GUI
npx prisma migrate dev # Create new migration
```

**Frontend:**
```bash
npm run dev            # Development server
npm run build          # Production build
npm run start          # Production server
npm run lint           # Check for errors
```

## Stopping the Project

**Stop Backend:**
- Press `Ctrl + C` in Terminal 1

**Stop Frontend:**
- Press `Ctrl + C` in Terminal 2

**Stop Redis (if using Docker):**
```bash
docker stop codefit-redis
```

## Next Steps After Running

1. ✅ Create test users (Job Seeker + Interviewer)
2. ✅ Create an interview session
3. ✅ Test video/audio in interview room
4. ✅ Test code editor collaboration
5. ✅ Test whiteboard drawing
6. ✅ Test friend system (job seekers only)

## Need Help?

- Check `SETUP.md` for detailed setup
- Check `ENV_SETUP.md` for environment variables
- Check `REDIS_SETUP.md` for Redis setup
- Check browser console for frontend errors
- Check backend terminal for server errors

---

**Happy coding! 🚀**

