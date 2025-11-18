# Next Steps - Session 2 Checklist

## 🎯 Goal
Get the application running with authentication and basic dashboard.

## ✅ Pre-Session Checklist

### 1. Install Dependencies
```bash
cd frontend
install-dependencies.bat
```

**What this installs**:
- Prisma & database tools
- Auth.js (authentication)
- UI libraries (Radix UI, dnd-kit)
- React Query, Zustand
- BullMQ, Redis client
- Utility libraries

**Time**: 5-10 minutes

---

### 2. Set Up PostgreSQL Database

#### Option A: Supabase (Recommended - Free & Easy)
1. Go to https://supabase.com
2. Click "Start your project"
3. Create a new project
4. Go to "Project Settings" → "Database"
5. Copy the "Connection string" (not "Connection pooling")
6. Use the URI mode: `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]`

#### Option B: Neon (Alternative)
1. Go to https://neon.tech
2. Create new project
3. Copy connection string

#### Option C: Local PostgreSQL
1. Download from https://www.postgresql.org/download/
2. Install PostgreSQL
3. Create database:
```sql
CREATE DATABASE seo_platform;
```

**Time**: 10-15 minutes

---

### 3. Set Up Redis

#### Option A: Upstash (Recommended - Free & Easy)
1. Go to https://upstash.com
2. Create account
3. Click "Create Database"
4. Choose Redis
5. Copy the Redis URL (starts with `redis://`)

#### Option B: Local Redis (WSL)
```bash
# In WSL
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli ping  # Should return PONG
```

**Redis URL**: `redis://localhost:6379`

**Time**: 5-10 minutes

---

### 4. Create Environment File

```bash
cd frontend
copy .env.example .env.local
```

Then edit `.env.local` and add:

```env
# REQUIRED - Database
DATABASE_URL="postgresql://[your-database-url]"

# REQUIRED - Redis
REDIS_URL="redis://[your-redis-url]"

# REQUIRED - Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[run: openssl rand -base64 32]"

# OPTIONAL - OAuth (can skip for now)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

**To generate NEXTAUTH_SECRET** (in WSL):
```bash
openssl rand -base64 32
```

**Time**: 5 minutes

---

### 5. Initialize Database

```bash
cd frontend

# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

**Time**: 2-3 minutes

---

### 6. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

**Expected Result**: You should see the landing page!

---

## 🚧 What to Build in Session 2

### Phase 1: Auth UI (45 min)
- [ ] Create `/auth/signin` page
- [ ] Create `/auth/signup` page
- [ ] Create auth form components
- [ ] Test registration flow
- [ ] Test login flow

### Phase 2: Dashboard Layout (45 min)
- [ ] Create dashboard layout with sidebar
- [ ] Add navigation (Dashboard, Keywords, Content, Calendar, Settings)
- [ ] Create header with user menu
- [ ] Add org/project selector
- [ ] Display credit balance

### Phase 3: Org Management (30 min)
- [ ] Create org API routes (GET, POST, PATCH)
- [ ] Build org settings page
- [ ] Team member management UI
- [ ] Org switching functionality

### Phase 4: Project Management (30 min)
- [ ] Create project API routes
- [ ] Build project list/grid
- [ ] Project creation modal
- [ ] Project settings
- [ ] Project switching

### Phase 5: Credit Display (20 min)
- [ ] Wallet balance component
- [ ] Transaction history API
- [ ] Credit usage chart (simple)
- [ ] Low balance warning

### Phase 6: Testing (20 min)
- [ ] Complete registration → org creation → 100 credits
- [ ] Login → see dashboard
- [ ] Create project
- [ ] View credit balance
- [ ] Switch projects
- [ ] Logout and login again

---

## 📝 Session 2 Success Criteria

By end of session, you should be able to:

1. ✅ Register a new account
2. ✅ See 100 trial credits in wallet
3. ✅ Land on dashboard after login
4. ✅ Create a new project
5. ✅ See sidebar navigation
6. ✅ View credit balance in header
7. ✅ Switch between projects
8. ✅ Log out and log back in

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# If fails, check:
# 1. DATABASE_URL is correct
# 2. Database exists
# 3. Firewall allows connection
```

### Prisma Client Not Found
```bash
npx prisma generate
```

### Port 3000 In Use
```bash
npx kill-port 3000
```

### Module Not Found
```bash
# Make sure you ran install
cd frontend
npm install
```

---

## 📚 Helpful Commands

```bash
# Database
npx prisma studio          # Visual database editor
npx prisma db push         # Update database schema
npx prisma migrate dev     # Create migration
npx prisma generate        # Regenerate client

# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run type-check         # Check TypeScript
npm run lint               # Run linter

# Utilities
npx kill-port 3000         # Kill port 3000
```

---

## 📖 Reference Files

- **Complete Spec**: `agents.md`
- **Progress Tracker**: `PROGRESS.md`
- **Setup Guide**: `frontend/SETUP.md`
- **Session 1 Summary**: `SESSION_1_SUMMARY.md`

---

## 💡 Quick Tips

1. **Use Prisma Studio**: Great for inspecting database
   ```bash
   npx prisma studio
   ```

2. **Check Database Schema**: It's all in `frontend/prisma/schema.prisma`

3. **API Response Format**: Use utilities in `lib/utils/response.ts`
   ```ts
   import { successResponse, errorResponse } from '@/lib/utils/response'
   ```

4. **Authentication Checks**: Use session utilities
   ```ts
   import { getCurrentUser, requireAuth } from '@/lib/auth/session'
   ```

5. **Error Handling**: Use custom error classes
   ```ts
   import { UnauthorizedError, NotFoundError } from '@/lib/utils/errors'
   ```

---

## 🎯 After Session 2

You'll be ready to build:
- Keyword management
- Content creation
- Calendar UI
- Export features

---

**Ready?** Start with installing dependencies!

```bash
cd frontend
install-dependencies.bat
```

Good luck! 🚀
