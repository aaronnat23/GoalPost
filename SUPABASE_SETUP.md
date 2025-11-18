# Supabase Setup Guide

Your Supabase Project ID: **predbnsojefbunhflvmr**
Your Database Password: **156423n@T**

---

## 🚀 Quick Start (10 Minutes)

### Step 1: Get Supabase API Keys

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/predbnsojefbunhflvmr
2. Click **Settings** (gear icon) → **API**
3. You'll see:
   - **Project URL**: `https://predbnsojefbunhflvmr.supabase.co`
   - **anon/public key**: Starts with `eyJ...` ← **Copy this!**
   - **service_role key**: Starts with `eyJ...` (keep SECRET, not needed for now)

---

### Step 2: Update `.env.local`

Good news! The `.env.local` file has already been created at `frontend/.env.local` with your database password.

You just need to add 2 things:

1. **Open** `frontend/.env.local`
2. **Replace** `your-anon-key-here` with the anon key you copied
3. **Add** your OpenAI API key (or Anthropic/Gemini)

The file should look like:

```env
# Database
DATABASE_URL="postgresql://postgres:156423n%40T@db.predbnsojefbunhflvmr.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://predbnsojefbunhflvmr.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." ← Paste your key here

# AI Provider
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-proj-..." ← Paste your OpenAI key here
```

**Note**: The `@` in the password is URL-encoded as `%40` - this is correct!

---

### Step 3: Get AI API Key (Required for Phase C)

You need **at least ONE** of these to use AI content generation.

### Option A: OpenAI (Recommended)

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click **"Create new secret key"**
4. Name it: "pseo-tools"
5. Copy the key (starts with `sk-...`)
6. **Important**: Add $5-10 credit at https://platform.openai.com/account/billing

**Cost**: ~$0.10-0.50 per 1500-word draft

### Option B: Anthropic (Claude)

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)
5. Add credits to your account

**Cost**: ~$0.15-0.60 per 1500-word draft

### Option C: Google Gemini

1. Go to https://makersuite.google.com/app/apikey
2. Sign up or log in
3. Click **"Create API Key"**
4. Copy the key (starts with `AI...`)

**Cost**: Free tier available, then ~$0.05-0.30 per 1500-word draft

### Step 4: Enable Google OAuth (Optional - 5 minutes)

This allows users to sign in with their Google account.

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and toggle it ON
3. Get Google credentials:
   - Go to https://console.cloud.google.com/
   - Create project or select existing
   - **APIs & Services** → **Credentials**
   - **Create Credentials** → **OAuth 2.0 Client ID**
   - Type: **Web application**
   - Authorized redirect URIs:
     ```
     https://predbnsojefbunhflvmr.supabase.co/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**
4. Paste into Supabase Google provider
5. Click **Save**

---

## 🚀 Run the App

Run these commands in order:

```bash
cd frontend

# 1. Install dependencies (includes Supabase client)
npm install

# 2. Push database schema to Supabase
npx prisma db push

# 3. Seed database with credit packages & pricing
npm run db:seed

# 4. Start development server
npm run dev
```

Open http://localhost:3000 🎉

---

## ✅ Verify Connection

### Test Database Connection:
```bash
npx prisma studio
```

This should open a browser window showing your database tables. If it works, your connection is correct!

### Test Application:
1. Visit http://localhost:3000
2. Click "Get Started"
3. Register an account
4. Should see dashboard with 100 credits

### Test Supabase Auth:
1. Go to http://localhost:3000/signup
2. Fill in Name, Email, Password
3. Click **Create account**
4. Should auto-sign-in → redirect to dashboard
5. Header shows your name and **100 credits**

### Test Google OAuth (if enabled):
1. Go to http://localhost:3000/signin
2. Click **Sign in with Google**
3. Select account
4. Redirects to dashboard with 100 credits

### Test Phase C (AI Content):
1. Click **Content** in sidebar
2. Click **+ New Brief**
3. Fill in headings, entities, FAQ
4. Click **Create Brief**
5. Click **Generate Draft**
6. Wait 30-60 seconds
7. **Success**: Draft with SEO score appears, ~15-20 credits deducted

---

## 🔍 Troubleshooting

### "Can't reach database server"
- ✅ Check your database password is correct
- ✅ Ensure no spaces in the connection string
- ✅ Make sure you're using the **URI** format, not Transaction pooling

### "Invalid connection string"
The format must be:
```
postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
```

NOT:
```
postgresql://postgres.PROJECT_ID:PASSWORD@...  # Wrong!
```

### Database Password Reset
If you forgot your password:
1. Go to Supabase Dashboard → Database Settings
2. Click "Reset Database Password"
3. Set a new password
4. Update your `.env.local`

### "AI generation failed" or "API key error"
- ✅ Check AI_PROVIDER is set correctly ("openai", "anthropic", or "gemini")
- ✅ Verify your API key is correct (no extra spaces)
- ✅ For OpenAI: ensure you have credits in your account
- ✅ Test your API key directly in the provider's playground

### "Insufficient credits" error
- You've used all your trial credits (100)
- Option 1: Add more credits via Prisma Studio:
  ```bash
  npx prisma studio
  ```
  Go to `credit_wallets` → find your org → update `balance` to 1000
- Option 2: Implement Stripe payments (Phase F)

---

## 📊 What Gets Created in Supabase

After running `npx prisma db push`, you'll see these tables in Supabase:

- users, accounts, sessions (Auth)
- orgs, org_users (Organizations)
- projects, project_settings
- credit_wallets, credit_txns, credit_packages, pricing_matrix
- keywords, topic_clusters, content_briefs, content_drafts
- calendar_items, jobs, export_bundles
- And more!

---

## 🎯 Using Supabase Features

### Row Level Security (Optional Enhancement)

Supabase has built-in RLS. For now, we're using application-level security (middleware), but you can add RLS later for extra protection.

### Storage (For Exports - Phase G)

When you need to store exported files:
1. Go to Supabase Dashboard → Storage
2. Create a bucket called `exports`
3. Use the Supabase keys in your `.env.local`

---

## 🆘 Need Help?

**Supabase Docs**: https://supabase.com/docs
**Your Project Dashboard**: https://supabase.com/dashboard/project/predbnsojefbunhflvmr

---

## 🎯 Quick Start Checklist

Follow these steps in order:

- [ ] **Step 1**: Get Supabase database password from dashboard
- [ ] **Step 2**: Get AI API key (OpenAI recommended)
- [ ] **Step 3**: Generate NEXTAUTH_SECRET
- [ ] **Step 4**: Create `frontend/.env.local` with all credentials
- [ ] **Step 5**: Run `npx prisma db push` to create tables
- [ ] **Step 6**: Run `npm run db:seed` to add initial data
- [ ] **Step 7**: Run `npm run dev` to start the app
- [ ] **Step 8**: Test registration (should get 100 credits)
- [ ] **Step 9**: Create a project
- [ ] **Step 10**: Add some keywords
- [ ] **Step 11**: Create a content brief
- [ ] **Step 12**: Generate AI draft (uses ~15-20 credits)
- [ ] **Step 13**: View SEO score and checklist

**Success**: You now have a fully working AI-powered SEO content platform! 🎉

---

## 📊 What You Can Do After Setup

### Phase A & B (Already Working)
✅ User registration & authentication
✅ Project management
✅ Keyword management (manual & bulk import)
✅ Credit system with wallet

### Phase C (New - AI Content)
✅ Create content briefs manually
✅ AI-powered draft generation (OpenAI/Anthropic/Gemini)
✅ Automatic SEO scoring (0-100 scale)
✅ SEO checklist (9 categories)
✅ Credit deduction for AI usage
✅ Draft management with status tracking

### Coming Next
🚧 Phase D: Drag-and-drop calendar scheduling
🚧 Phase E: Internal link suggestions
🚧 Phase F: Stripe payment integration
🚧 Phase G: Export system (MD/HTML/DOCX)

---

**Ready?** Copy your credentials to `.env.local` and let's go! 🚀

**Last Updated**: November 4, 2025 - Phase C Complete (40% MVP)
