# Quick Start Guide - Run CodeFit

## 🚀 Fast Setup (5 Minutes)

### Prerequisites Check
```bash
# 1. MySQL running? (Create database if needed)
mysql -u root -p
CREATE DATABASE codefit;
EXIT;

# 2. Redis running?
redis-cli ping
# If not: docker run -d -p 6379:6379 --name codefit-redis redis:latest
```

### Step 1: Setup Database (First Time Only)
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### Step 2: Start Backend
**Open Terminal 1:**
```bash
cd backend
npm run start:dev
```
✅ Wait for: `🚀 Backend server running on http://localhost:3001`

### Step 3: Start Frontend
**Open Terminal 2 (NEW terminal):**
```bash
cd frontend
npm run dev
```
✅ Wait for: `ready started server on 0.0.0.0:3000`

### Step 4: Open Browser
Go to: **http://localhost:3000**

---

## 📋 Complete Checklist

- [ ] MySQL database `codefit` created
- [ ] Redis running (check with `redis-cli ping`)
- [ ] Backend `.env` configured (you have this ✅)
- [ ] Frontend `.env.local` created (just created ✅)
- [ ] Dependencies installed (`npm install` in both folders)
- [ ] Database migrated (`npx prisma migrate dev`)

---

## 🎯 First Time User Flow

1. **Register** → http://localhost:3000/register
   - Create a **Job Seeker** account
   - Create an **Interviewer** account

2. **Login** → http://localhost:3000/login

3. **As Interviewer:**
   - Go to Dashboard
   - Click "Create Interview"
   - Add candidate
   - Click "Join Interview"

4. **As Job Seeker:**
   - View interviews on dashboard
   - Click "Join Interview"
   - Test video, code editor, whiteboard

---

## ⚠️ Common Issues

**Backend won't start?**
- Check MySQL: `mysql -u root -p`
- Check Redis: `redis-cli ping`
- Verify `.env` file exists and has correct DATABASE_URL

**Frontend won't start?**
- Check `.env.local` exists in frontend folder
- Verify backend is running first
- Check port 3000 is not in use

**Database errors?**
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## 🛑 Stop the Project

Press `Ctrl + C` in both terminals

---

**Need more details?** See `RUN_PROJECT.md` for complete guide.

