# CodeFit - Technical Interview Platform

## 🚀 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (NestJS) | 3001 | http://localhost:3001 |
| Database (MySQL) | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |

## 🔧 Development Setup

A production-grade web application for conducting technical interviews with real-time video, collaborative coding, and whiteboard capabilities.

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Monaco Editor
- Konva.js
- WebRTC
- Socket.IO Client

**Backend:**
- NestJS
- TypeScript
- MySQL
- Redis
- Socket.IO
- Prisma ORM
- JWT Authentication

## Project Structure

```
codefit/
├── backend/          # NestJS backend
├── frontend/         # Next.js frontend
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- Redis 6+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npm run start:dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

### Environment Variables

See `.env.example` files in each directory for required variables.

## Features

- ✅ Real-time video interviews (WebRTC)
- ✅ Collaborative code editor (Monaco)
- ✅ Real-time whiteboard (Konva)
- ✅ Friend system (job seekers)
- ✅ Online presence tracking
- ✅ Role-based access control
- ✅ Interview session management

## License

MIT

