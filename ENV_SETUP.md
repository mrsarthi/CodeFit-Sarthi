# Environment Variables Setup Guide

Complete guide to setting up environment variables for CodeFit.

## Quick Start

### Backend Environment Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Copy the example file:**
   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.example .env
   
   # On macOS/Linux
   cp .env.example .env
   ```

3. **Edit `.env` file with your values:**

   ```env
   # Database Configuration
   DATABASE_URL="mysql://root:yourpassword@localhost:3306/codefit?schema=public"
   ```
   
   **Replace:**
   - `root` → Your MySQL username
   - `yourpassword` → Your MySQL password
   - `localhost:3306` → Your MySQL host and port (if different)
   - `codefit` → Your database name

   ```env
   # JWT Secrets (IMPORTANT: Change these in production!)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
   JWT_REFRESH_EXPIRES_IN=7d
   ```
   
   **Generate secure secrets:**
   ```bash
   # Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Or use an online generator
   # https://randomkeygen.com/
   ```

   ```env
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```
   
   **If Redis requires password:**
   ```env
   REDIS_PASSWORD=your-redis-password
   ```

   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

### Frontend Environment Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Copy the example file:**
   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.example .env.local
   
   # On macOS/Linux
   cp .env.example .env.local
   ```

3. **Edit `.env.local` file:**

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXT_PUBLIC_WS_URL=http://localhost:3001
   ```
   
   **For production, change to:**
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
   NEXT_PUBLIC_WS_URL=https://api.yourdomain.com
   ```

## Detailed Configuration

### Backend Variables Explained

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:port/db` | ✅ Yes |
| `JWT_SECRET` | Secret for access tokens | Random 32+ char string | ✅ Yes |
| `JWT_EXPIRES_IN` | Access token expiration | `15m`, `1h`, `7d` | ✅ Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Random 32+ char string | ✅ Yes |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d`, `30d` | ✅ Yes |
| `REDIS_HOST` | Redis server hostname | `localhost` | ✅ Yes |
| `REDIS_PORT` | Redis server port | `6379` | ✅ Yes |
| `REDIS_PASSWORD` | Redis password (if required) | `your-password` | ❌ No |
| `PORT` | Backend server port | `3001` | ✅ Yes |
| `NODE_ENV` | Environment mode | `development`, `production` | ✅ Yes |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` | ✅ Yes |

### Frontend Variables Explained

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001/api` | ✅ Yes |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `http://localhost:3001` | ✅ Yes |

**Note:** `NEXT_PUBLIC_*` prefix is required for Next.js to expose these to the browser.

## Step-by-Step Setup

### 1. MySQL Database Setup

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE codefit;

-- Verify
SHOW DATABASES;
```

### 2. Redis Setup

**Windows (using WSL or Docker):**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or install Redis for Windows
# Download from: https://github.com/microsoftarchive/redis/releases
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### 3. Complete Backend Setup

```bash
cd backend

# 1. Create .env file
cp .env.example .env

# 2. Edit .env with your values (use a text editor)
# Windows: notepad .env
# macOS: open -e .env
# Linux: nano .env

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Verify connection
npx prisma studio
# Should open Prisma Studio in browser
```

### 4. Complete Frontend Setup

```bash
cd frontend

# 1. Create .env.local file
cp .env.example .env.local

# 2. Edit .env.local (usually no changes needed for local dev)
# Windows: notepad .env.local
# macOS: open -e .env.local
# Linux: nano .env.local
```

## Production Environment

### Backend Production `.env`:

```env
DATABASE_URL="mysql://user:password@production-db-host:3306/codefit?schema=public"
JWT_SECRET=<generate-strong-secret-64-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate-strong-secret-64-chars>
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Frontend Production `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_WS_URL=https://api.yourdomain.com
```

## Security Best Practices

1. **Never commit `.env` files to git** (already in `.gitignore`)
2. **Use strong, random secrets** (minimum 32 characters)
3. **Use different secrets for development and production**
4. **Rotate secrets periodically**
5. **Use environment-specific database credentials**
6. **Enable Redis password in production**
7. **Use HTTPS in production**

## Troubleshooting

### Database Connection Error

```
Error: Can't reach database server
```

**Solutions:**
- Verify MySQL is running: `mysql -u root -p`
- Check DATABASE_URL format: `mysql://user:password@host:port/database`
- Verify credentials are correct
- Check firewall/network settings

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**
- Verify Redis is running: `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT
- If using Docker, verify container is running: `docker ps`
- Check Redis password if required

### JWT Errors

```
Error: secretOrPrivateKey must have a value
```

**Solutions:**
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are set
- Verify they are not empty strings
- Regenerate if needed

### CORS Errors

```
Access to fetch blocked by CORS policy
```

**Solutions:**
- Verify FRONTEND_URL matches your frontend URL exactly
- Check for trailing slashes
- In development, ensure both servers are running

## Verification

After setup, verify everything works:

```bash
# Backend
cd backend
npm run start:dev
# Should see: 🚀 Backend server running on http://localhost:3001

# Frontend (new terminal)
cd frontend
npm run dev
# Should see: Ready on http://localhost:3000
```

## Example Complete `.env` Files

### Backend `.env` (Development)
```env
DATABASE_URL="mysql://root:mypassword@localhost:3306/codefit?schema=public"
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local` (Development)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

**Need help?** Check the main `SETUP.md` file for complete project setup instructions.

