# ⚡ Quick Start Guide

**Phase A is COMPLETE!** Here's how to get running in 5 minutes.

---

## 🎯 What You Need

- ✅ Node.js 22+ and npm 10+
- ✅ PostgreSQL database (local or Supabase)
- ❌ NO Redis needed yet!
- ❌ NO AI APIs needed yet!
- ❌ NO Stripe needed yet!

---

## 🚀 5-Minute Setup

### 1. Install Dependencies (2 min)
```bash
cd frontend
install-dependencies.bat
```

### 2. Get PostgreSQL URL (1 min)

**Option A - Supabase (Easiest)**:
1. Go to https://supabase.com
2. Create project → Get connection string

**Option B - Local**:
```sql
CREATE DATABASE seo_platform;
```
URL: `postgresql://user:password@localhost:5432/seo_platform`

### 3. Set Environment Variables (1 min)
```bash
copy .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="your_postgresql_url"
NEXTAUTH_SECRET="any-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"
```

Generate secret:
```bash
# In WSL or Git Bash
openssl rand -base64 32
```

### 4. Initialize Database (1 min)
```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

### 5. Start App! (<1 min)
```bash
npm run dev
```

Visit: **http://localhost:3000** 🎉

---

## ✅ First-Time Flow

1. **Click "Get Started"** on landing page
2. **Fill registration form**:
   - Name, email, password
   - Org name (optional)
3. **Auto sign-in** → Dashboard
4. **See 100 free credits** in header
5. **Explore**:
   - Create a project
   - View credits page
   - Check settings

---

## 🔍 Verify Everything Works

```bash
✓ Landing page loads
✓ Sign up works
✓ See 100 credits after signup
✓ Dashboard shows stats
✓ Can create a project
✓ Navigation works
✓ Credits page shows transactions
✓ Can sign out and back in
```

---

## 💡 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production

# Database
npx prisma studio       # Visual DB editor
npx prisma db push      # Update database
npx prisma generate     # Regenerate client
npm run db:seed         # Seed data again

# Debugging
npm run type-check      # Check TypeScript
npm run lint            # Run ESLint
```

---

## 🎓 What's Built

### ✅ Working Features
- User registration & login
- Organization creation
- Project management
- Credit wallet (100 free credits)
- Transaction history
- Dashboard with stats
- Full navigation
- Settings pages

### 🚧 Coming Soon
- Keywords management (Phase B)
- Topic clustering (Phase B)
- AI content generation (Phase C)
- Calendar scheduling (Phase D)
- Credit purchases with Stripe (Phase F)

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running
- Test connection with `npx prisma db pull`

### "Prisma Client not found"
```bash
npx prisma generate
```

### Port 3000 already in use
```bash
npx kill-port 3000
```

### Clear and restart
```bash
# Delete .next folder and restart
rm -rf .next
npm run dev
```

---

## 📚 Documentation

| Doc | What It's For |
|-----|---------------|
| **PHASE_A_COMPLETE.md** | Full Phase A details |
| **agents.md** | Complete product spec |
| **PROGRESS.md** | Task checklist |
| **frontend/SETUP.md** | Detailed setup guide |

---

## 🎯 Quick Test Script

After setup, test everything:

```bash
# 1. Open app
http://localhost:3000

# 2. Register
test@example.com / password123

# 3. Check credits
Header shows: 100 credits ✓

# 4. Create project
Settings → Projects → + New Project

# 5. View credits page
Sidebar → Credits
See: Trial Bonus +100 ✓

# 6. Sign out & back in
User menu → Sign Out
Then sign in again
Still see 100 credits ✓
```

---

## 🚀 Next Steps

Once everything works:

1. **Explore the UI** - Click everything!
2. **Read agents.md** - See what's being built
3. **Check PROGRESS.md** - See the roadmap
4. **Start Phase B** - Build keyword management

---

## 🎉 You're Ready!

Phase A is **100% complete**.

No Redis. No AI APIs. No external services.

Just PostgreSQL and you have a **fully functional app**!

**Happy coding!** 🚀

---

*Need help? Check PHASE_A_COMPLETE.md for detailed info.*
