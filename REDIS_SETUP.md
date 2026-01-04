# Redis Setup Guide

Redis is **REQUIRED** for CodeFit to run. It's used for real-time presence tracking (online/offline status).

## Quick Setup Options

### Option 1: Docker (Easiest - Recommended)

```bash
# Run Redis in Docker container
docker run -d -p 6379:6379 --name codefit-redis redis:latest

# Verify it's running
docker ps

# Test connection
docker exec -it codefit-redis redis-cli ping
# Should return: PONG
```

**To stop Redis:**
```bash
docker stop codefit-redis
docker start codefit-redis  # To start again
```

### Option 2: Windows (Native Installation)

1. **Download Redis for Windows:**
   - Visit: https://github.com/microsoftarchive/redis/releases
   - Download the latest `.msi` installer
   - Run the installer

2. **Start Redis:**
   ```powershell
   # Redis should start automatically as a service
   # Or start manually:
   redis-server
   ```

3. **Verify:**
   ```powershell
   redis-cli ping
   # Should return: PONG
   ```

### Option 3: WSL (Windows Subsystem for Linux)

If you have WSL installed:

```bash
# Open WSL terminal
wsl

# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Verify
redis-cli ping
# Should return: PONG
```

### Option 4: macOS (Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Or run manually
redis-server

# Verify
redis-cli ping
# Should return: PONG
```

### Option 5: Linux (Ubuntu/Debian)

```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server  # Auto-start on boot

# Verify
redis-cli ping
# Should return: PONG
```

## Verify Redis is Running

```bash
# Test connection
redis-cli ping
# Expected output: PONG

# Check if Redis is listening on port 6379
# Windows PowerShell:
netstat -an | findstr 6379

# macOS/Linux:
netstat -an | grep 6379
# Or:
lsof -i :6379
```

## Configuration

Once Redis is running, your backend `.env` should have:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty if no password
```

If your Redis requires a password:

```env
REDIS_PASSWORD=your-redis-password
```

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:6379"

**Solution:** Redis is not running
- Start Redis using one of the methods above
- Verify with `redis-cli ping`

### Error: "Redis connection failed"

**Solutions:**
1. Check Redis is running: `redis-cli ping`
2. Verify `REDIS_HOST` and `REDIS_PORT` in `.env`
3. Check firewall isn't blocking port 6379
4. If using Docker, verify container is running: `docker ps`

### Windows: "redis-cli is not recognized"

**Solution:** Redis is not installed or not in PATH
- Install Redis using Option 2 above
- Or use Docker (Option 1) - recommended

## What Happens Without Redis?

The backend **will not start** if Redis is unavailable. You'll see errors like:

```
Error: connect ECONNREFUSED 127.0.0.1:6379
[Nest] ERROR [ExceptionHandler] Nest can't resolve dependencies...
```

## Production Setup

For production, use a managed Redis service:

- **AWS ElastiCache**
- **Redis Cloud** (https://redis.com/cloud)
- **DigitalOcean Managed Redis**
- **Azure Cache for Redis**

Or run Redis on a dedicated server with:
- Password authentication enabled
- Persistence configured
- Proper backup strategy

## Quick Start (Recommended for Development)

**Just want to get started quickly? Use Docker:**

```bash
docker run -d -p 6379:6379 --name codefit-redis redis:latest
```

That's it! Redis is now running and ready to use.

