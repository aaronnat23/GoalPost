# 🚀 Installation & Setup Guide

**Last Updated**: November 4, 2025
**Status**: Ready to Install & Run

---

## 📋 Prerequisites

Before starting, make sure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Supabase account** (free tier works!)
- **API Key** for one of the following AI providers:
  - Google Gemini (Recommended - has free tier)
  - OpenAI (GPT-4)
  - Anthropic (Claude)

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Navigate to Frontend Folder

```bash
cd /mnt/c/Users/User/Documents/pseo_tools/frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Next.js 16
- React 19
- Supabase client libraries
- Prisma ORM
- Google Generative AI SDK (official)
- All other dependencies

### Step 3: Configure Environment Variables

Your `.env.local` file is already partially configured. You need to add:

1. **Supabase Anon Key** (required)
2. **AI Provider API Key** (at least one)

#### Get Your Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/predbnsojefbunhflvmr
2. Click **Settings** → **API**
3. Copy the **anon public** key (starts with `eyJ...`)
4. Open `frontend/.env.local`
5. Update line 7 with your anon key:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxxxxxxxxxxxxxxxx"
```

#### Add AI Provider API Key

Choose ONE of the following:

**Option 1: Google Gemini (Recommended)**
```env
GOOGLE_API_KEY="your-google-api-key-here"
AI_PROVIDER="gemini"
```

Get your key at: https://aistudio.google.com/app/apikey

**Option 2: OpenAI**
```env
OPENAI_API_KEY="sk-your-openai-key-here"
AI_PROVIDER="openai"
```

Get your key at: https://platform.openai.com/api-keys

**Option 3: Anthropic Claude**
```env
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"
AI_PROVIDER="anthropic"
```

Get your key at: https://console.anthropic.com/

### Step 4: Set Up Database

```bash
# Push database schema to Supabase
npx prisma db push

# Seed initial data (credit packages, pricing matrix)
npm run db:seed
```

### Step 5: Start Development Server

```bash
npm run dev
```

### Step 6: Open in Browser

Visit: **http://localhost:3000**

🎉 **You're ready!**

---

## 🧪 Testing Your Installation

### 1. Create Account

1. Click **Get Started** or **Sign Up**
2. Enter email and password
3. Click **Sign Up**
4. ✅ Account created with 100 trial credits

### 2. Create a Project

1. Go to **Projects** page
2. Click **New Project**
3. Enter name and domain
4. Click **Create**
5. ✅ Project created

### 3. Add Keywords

1. Go to **Keywords** page
2. Click **Add Keywords**
3. Enter keywords manually or bulk paste
4. ✅ Keywords added

### 4. Generate AI Content

1. Go to **Content** page
2. Click **Create Brief**
3. Fill in target keyword and details
4. Click **Create**
5. Click **Generate Draft** on your brief
6. ✅ AI-generated content appears with SEO score
7. ✅ Credits deducted from your wallet

---

## 📁 Project Structure

```
pseo_tools/
├── frontend/                    # Next.js application
│   ├── app/                    # App router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Auth pages (signin/signup)
│   │   ├── dashboard/         # Dashboard pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   ├── lib/                   # Utilities & services
│   │   ├── ai/               # AI provider abstraction
│   │   ├── supabase/         # Supabase clients
│   │   ├── db/               # Database utilities
│   │   └── utils/            # Helper functions
│   ├── prisma/               # Database schema & seed
│   ├── public/               # Static assets
│   ├── .env.local            # Environment variables
│   └── package.json          # Dependencies
├── PROGRESS.md               # Phase tracker
├── READY_TO_TEST.md          # Testing guide
└── INSTALLATION_GUIDE.md     # This file
```

---

## 🔧 Available Scripts

Run these commands from the `frontend/` directory:

```bash
# Development
npm run dev              # Start dev server (with Turbopack)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma db push       # Push schema to database
npm run db:seed          # Seed initial data
npx prisma studio        # Open Prisma Studio (DB GUI)
npx prisma generate      # Generate Prisma client

# Type checking
npm run type-check       # Run TypeScript compiler
```

---

## 🎯 AI Provider Configuration

### Google Gemini (Default)

**Model**: `gemini-2.0-flash-exp`
**Implementation**: Official `@google/generative-ai` SDK
**Free Tier**: ✅ Yes (generous limits)
**Cost**: $0.05 - $0.30 per 1500-word draft

**Environment Variables**:
```env
AI_PROVIDER="gemini"
GOOGLE_API_KEY="your-api-key"
```

**Get API Key**: https://aistudio.google.com/app/apikey

### OpenAI

**Model**: `gpt-4-turbo-preview`
**Free Tier**: ❌ No
**Cost**: $0.10 - $0.50 per 1500-word draft

**Environment Variables**:
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
```

**Get API Key**: https://platform.openai.com/api-keys

### Anthropic Claude

**Model**: `claude-3-5-sonnet-20241022`
**Free Tier**: ❌ No
**Cost**: $0.15 - $0.60 per 1500-word draft

**Environment Variables**:
```env
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
```

**Get API Key**: https://console.anthropic.com/

---

## 🔐 Environment Variables Reference

Your `frontend/.env.local` should contain:

```env
# Database (Already configured)
DATABASE_URL="postgresql://postgres:156423n%40T@db.predbnsojefbunhflvmr.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://predbnsojefbunhflvmr.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"    # ← ADD THIS

# AI Provider (Choose one)
AI_PROVIDER="gemini"                                   # ← SET THIS
GOOGLE_API_KEY="your-google-api-key"                  # ← ADD THIS

# Optional: Other AI Providers
OPENAI_API_KEY="sk-..."                               # Optional
ANTHROPIC_API_KEY="sk-ant-..."                        # Optional

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🆘 Troubleshooting

### Issue: `npm install` fails

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: Database connection error

**Solution**:
- Check that `DATABASE_URL` in `.env.local` has the password encoded as `156423n%40T`
- The `@` character must be URL-encoded as `%40`
- Make sure you're connected to the internet

### Issue: Supabase "Invalid API key" error

**Solution**:
1. Verify you copied the **anon public** key (not the service role key)
2. Check for extra spaces or quotes in `.env.local`
3. The key should start with `eyJ...`
4. Restart the dev server after changing `.env.local`

### Issue: Prisma errors

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Push schema again
npx prisma db push

# If still having issues, clear Prisma cache
rm -rf node_modules/.prisma
npm install
```

### Issue: AI generation fails

**Solution**:
1. Check that you have a valid API key for your chosen provider
2. Verify `AI_PROVIDER` matches the provider you have a key for
3. Check API usage limits on your provider's dashboard
4. Restart the dev server after changing `.env.local`

### Issue: Port 3000 already in use

**Solution**:
```bash
# Kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Or run on a different port
npm run dev -- -p 3001
```

### Issue: "Module not found" errors

**Solution**:
```bash
# Reinstall dependencies
npm install

# Make sure postinstall script ran
npx prisma generate
```

---

## 🎨 Optional: Enable Google OAuth

Want "Sign in with Google" button?

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Toggle **Google** ON
3. Get OAuth credentials from Google Cloud Console:
   - Visit: https://console.cloud.google.com/
   - Create OAuth 2.0 Client ID
   - Authorized redirect URI: `https://predbnsojefbunhflvmr.supabase.co/auth/v1/callback`
4. Paste Client ID & Secret into Supabase
5. **Save**

Test by clicking "Sign in with Google" on the sign-in page.

---

## 📊 What's Included

### ✅ Phase A - Foundations (100% Complete)
- Next.js 16 + TypeScript + Tailwind
- Supabase authentication (email/password + OAuth)
- Project management
- Credit system with wallet
- Dashboard UI

### ✅ Phase B - Keywords (100% Complete)
- Manual keyword entry
- Bulk import
- Search & filtering
- Color-coded difficulty
- Tag management

### ✅ Phase C - AI Content (100% Complete)
- Content brief creation
- AI outline generation
- AI draft generation (1500+ words)
- SEO scoring (0-100)
- 9-category SEO checklist
- Credit deduction system
- Multi-provider support (OpenAI, Anthropic, Gemini)

### 🚧 Coming Soon
- Phase D: Calendar & Scheduling
- Phase E: Internal Linking
- Phase F: Stripe Payments
- Phase G: Export System

---

## 💡 Usage Tips

### Credit System
- New accounts get **100 trial credits**
- Each AI draft costs ~15-20 credits
- SEO scoring is included (no extra cost)
- View transaction history in **Credits** page

### Best Practices
1. Start with a good content brief (include entities, FAQs)
2. Use the recommended word count
3. Review and edit AI-generated drafts
4. Check SEO score and improve weak areas
5. Monitor credit usage

### AI Provider Selection
- **Gemini**: Best for free tier, fast responses
- **OpenAI**: Best for high-quality content
- **Claude**: Best for nuanced, long-form content

---

## 📚 Additional Resources

- **Main Documentation**: See `PROGRESS.md` for detailed phase breakdown
- **Testing Guide**: See `READY_TO_TEST.md` for feature testing checklist
- **Supabase Setup**: See `SUPABASE_SETUP.md` for auth configuration
- **Phase Details**: See `PHASE_C_COMPLETE.md` for AI content features

---

## 🚀 Next Steps After Installation

Once everything is working:

### Option 1: Continue Development
- Implement Phase D (Calendar scheduling)
- Add Phase E (Internal linking)
- Integrate Phase F (Stripe payments)

### Option 2: Deploy to Production
- Deploy to Vercel
- Set up production Supabase project
- Configure production environment variables
- Set up custom domain

### Option 3: Enhance Features
- Add rich text editor
- Implement content templates
- Add batch operations
- Create content export functionality

---

## ✅ Installation Checklist

- [ ] Node.js 18+ installed
- [ ] Cloned/navigated to project folder
- [ ] Ran `npm install` in frontend folder
- [ ] Added Supabase anon key to `.env.local`
- [ ] Added AI provider API key to `.env.local`
- [ ] Set `AI_PROVIDER` variable in `.env.local`
- [ ] Ran `npx prisma db push`
- [ ] Ran `npm run db:seed`
- [ ] Ran `npm run dev`
- [ ] Opened http://localhost:3000 in browser
- [ ] Created test account (100 credits)
- [ ] Created test project
- [ ] Added test keywords
- [ ] Generated AI content draft
- [ ] Verified SEO score appears
- [ ] Verified credits were deducted

---

## 🎉 Success!

If you completed all the steps above, your SEO platform is now **fully operational**!

**You can now**:
- ✅ Manage multiple projects
- ✅ Import keywords in bulk
- ✅ Generate AI-powered content briefs
- ✅ Create SEO-optimized drafts
- ✅ Track credit usage
- ✅ Score content quality

**Happy content generating!** 🚀

---

**Questions or Issues?**
Check the troubleshooting section above or review the documentation files in the project root.
