# CodeFit Project Structure

Complete file structure of the CodeFit technical interview platform.

```
codefit/
├── backend/                          # NestJS Backend
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   ├── src/
│   │   ├── auth/                   # Authentication module
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── user/                   # User module
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.module.ts
│   │   ├── interview/              # Interview module
│   │   │   ├── dto/
│   │   │   │   └── create-interview.dto.ts
│   │   │   ├── interview.controller.ts
│   │   │   ├── interview.service.ts
│   │   │   └── interview.module.ts
│   │   ├── friend/                 # Friend system module
│   │   │   ├── friend.controller.ts
│   │   │   ├── friend.service.ts
│   │   │   └── friend.module.ts
│   │   ├── websocket/              # WebSocket gateway
│   │   │   ├── websocket.gateway.ts
│   │   │   └── websocket.module.ts
│   │   ├── prisma/                 # Prisma service
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   ├── redis/                  # Redis service
│   │   │   ├── redis.service.ts
│   │   │   └── redis.module.ts
│   │   ├── app.module.ts           # Root module
│   │   └── main.ts                 # Application entry point
│   ├── .env.example
│   ├── .gitignore
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                        # Next.js Frontend
│   ├── app/                         # App Router pages
│   │   ├── dashboard/
│   │   │   ├── create-interview/
│   │   │   │   └── page.tsx
│   │   │   ├── friends/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── interview/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── friends/
│   │   │   └── FriendList.tsx
│   │   ├── interview/
│   │   │   ├── CodeEditor.tsx
│   │   │   └── Whiteboard.tsx
│   │   ├── layout/
│   │   │   └── navbar.tsx
│   │   └── ui/                      # ShadCN UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── select.tsx
│   ├── lib/
│   │   ├── api.ts                   # Axios API client
│   │   ├── socket.ts                # Socket.IO client
│   │   ├── store.ts                 # Zustand store
│   │   └── utils.ts                 # Utility functions
│   ├── .env.example
│   ├── .gitignore
│   ├── middleware.ts                # Next.js middleware
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── README.md
├── SETUP.md
└── PROJECT_STRUCTURE.md
```

## Key Features by Module

### Backend Modules

**Auth Module**
- JWT-based authentication
- User registration and login
- Token refresh mechanism
- Password hashing with bcrypt

**User Module**
- User profile management
- User search functionality
- Role-based access

**Interview Module**
- Create, read, update interviews
- Interview status management
- Participant management
- Interview lifecycle (scheduled → active → completed)

**Friend Module**
- Send/accept/reject friend requests
- Friend list management
- Job seeker only feature

**WebSocket Module**
- Real-time code editor sync
- Whiteboard event broadcasting
- WebRTC signaling
- Online presence tracking
- Interview room management

### Frontend Pages

**Landing Page** (`/`)
- Marketing/landing page
- Feature highlights

**Authentication** (`/login`, `/register`)
- User registration
- Login with JWT
- Role selection

**Dashboard** (`/dashboard`)
- Interview list
- Create interview (interviewers)
- Friend list (job seekers)
- Interview management

**Interview Room** (`/interview/[id]`)
- WebRTC video/audio
- Real-time code editor
- Collaborative whiteboard
- Participant management

### Components

**CodeEditor**
- Monaco Editor integration
- Real-time synchronization
- Multi-cursor support
- Language selection

**Whiteboard**
- Konva.js canvas
- Drawing tools (pen, shapes)
- Real-time sync
- Color and stroke width controls

**FriendList**
- Friend requests
- Online/offline status
- Friend management

## Database Schema

**Users**
- Authentication and profile data
- Role-based access (JOB_SEEKER, INTERVIEWER)

**Interviews**
- Interview sessions
- Status tracking
- Scheduling

**Interview Participants**
- Many-to-many relationship
- Candidate and interviewer roles

**Friend Requests**
- Friend request management
- Status tracking (PENDING, ACCEPTED, REJECTED)

**Friends**
- Bidirectional friend relationships
- Job seeker only

## Real-time Architecture

**Socket.IO Events:**
- `interview:join` - Join interview room
- `interview:leave` - Leave interview room
- `code:change` - Code editor changes
- `code:cursor` - Cursor position updates
- `whiteboard:draw` - Whiteboard drawing events
- `whiteboard:clear` - Clear whiteboard
- `webrtc:offer` - WebRTC offer
- `webrtc:answer` - WebRTC answer
- `webrtc:ice-candidate` - ICE candidate exchange
- `friend:online` - Friend online status
- `friend:offline` - Friend offline status

## Technology Stack

**Backend:**
- NestJS (Node.js framework)
- Prisma (ORM)
- MySQL (Database)
- Redis (Caching & Presence)
- Socket.IO (WebSockets)
- JWT (Authentication)

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Monaco Editor
- Konva.js
- WebRTC
- Socket.IO Client
- Zustand (State management)

