# Integration & Testing Guide - Phase A, B, C

This guide will help you set up all necessary services and test the complete functionality of Phases A, B, and C.

---

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] A Supabase account (free tier)
- [ ] At least ONE AI API key:
  - OpenAI API key, OR
  - Anthropic API key, OR
  - Google Gemini API key

---

## 🔧 Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `pseo-tools` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

### 1.2 Get Database Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **"URI"** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

Example:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

---

## 🔑 Step 2: Get AI API Keys

You need **at least one** of these. OpenAI is recommended for best results.

### Option A: OpenAI (Recommended)

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-...`)
5. **Important**: Add $5-10 credit to your account at [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)

**Estimated Cost**: ~$0.10-0.50 per 1500-word draft

### Option B: Anthropic (Claude)

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Copy the key
5. Add credits to your account

**Estimated Cost**: ~$0.15-0.60 per 1500-word draft

### Option C: Google Gemini

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign up or log in
3. Click **"Create API Key"**
4. Copy the key

**Estimated Cost**: Free tier available, then ~$0.05-0.30 per 1500-word draft

---

## ⚙️ Step 3: Configure Environment Variables

1. Navigate to your frontend directory:
```bash
cd frontend
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Open `.env.local` and fill in:

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Auth (generate random strings for these)
NEXTAUTH_SECRET="your-random-secret-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# AI Provider (choose ONE and set it)
AI_PROVIDER="openai"  # or "anthropic" or "gemini"

# OpenAI (if using)
OPENAI_API_KEY="sk-..."

# Anthropic (if using)
ANTHROPIC_API_KEY="sk-ant-..."

# Google Gemini (if using)
GOOGLE_API_KEY="AI..."
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄️ Step 4: Initialize Database

1. Install dependencies:
```bash
npm install
```

2. Push the database schema to Supabase:
```bash
npx prisma db push
```

You should see:
```
✔ Generated Prisma Client
✔ The database is now in sync with your Prisma schema
```

3. Seed the database with initial data:
```bash
npm run db:seed
```

This creates:
- Credit packages (100, 500, 1000, 2500 credits)
- Pricing matrix for all actions
- Default settings

---

## 🚀 Step 5: Start the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to: **http://localhost:3000**

You should see the landing page!

---

## ✅ Step 6: Test Phase A - Foundations

### 6.1 Test Registration

1. Click **"Get Started"** or **"Sign Up"**
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: testpass123
3. Click **"Sign Up"**

**Expected Result**: ✅
- Account created
- Automatically logged in
- Organization created
- 100 trial credits added to wallet
- Redirected to dashboard

### 6.2 Test Dashboard

**Check**:
- [ ] Credit balance shows **100 credits** in header
- [ ] Sidebar navigation works
- [ ] Dashboard shows stats (0 projects, 0 keywords, etc.)
- [ ] Quick actions visible

### 6.3 Test Project Creation

1. Click **"Projects"** in sidebar
2. Click **"+ New Project"**
3. Fill in:
   - Name: My Test Blog
   - Niche: Technology
   - Locale: en-US
4. Click **"Create Project"**

**Expected Result**: ✅
- Project created
- Appears in project list
- Project switcher in header shows new project

---

## ✅ Step 7: Test Phase B - Keywords

### 7.1 Test Manual Keyword Entry

1. Click **"Keywords"** in sidebar
2. Select your project from dropdown
3. Click **"+ Add Keyword"**
4. Fill in:
   - Keyword: SEO best practices
   - Search Volume: 5000
   - Difficulty: 45
   - Tags: seo, guide
5. Click **"Add Keyword"**

**Expected Result**: ✅
- Keyword appears in list
- Difficulty color-coded (45 = yellow)
- Tags displayed as badges

### 7.2 Test Bulk Import

1. Click **"Bulk Import"**
2. Paste:
```
content marketing tips
keyword research tools
on-page SEO checklist
link building strategies
```
3. Click **"Import Keywords"**

**Expected Result**: ✅
- 4 keywords added
- All visible in keyword list
- Search functionality works

### 7.3 Test Keyword Search

1. Type "SEO" in search box
2. Press Enter or click search

**Expected Result**: ✅
- Only keywords containing "SEO" shown
- Search is case-insensitive

---

## ✅ Step 8: Test Phase C - AI Content Generation

### 8.1 Test Brief Creation

1. Click **"Content"** in sidebar
2. Ensure your project is selected
3. Click **"+ New Brief"**
4. Fill in:
   - **Word Count**: 1500
   - **Headings** (one per line):
     ```
     Introduction to SEO
     What is SEO?
     Why SEO Matters
     Key SEO Components
     On-Page SEO
     Off-Page SEO
     Technical SEO
     Conclusion
     ```
   - **Entities**: SEO, search engines, Google, keywords, backlinks, content optimization
   - **FAQ**:
     ```
     What is SEO?
     How long does SEO take?
     Is SEO worth it?
     ```
5. Click **"Create Brief"**

**Expected Result**: ✅
- Brief created
- Shows in Briefs tab
- Displays word count (1500)
- Shows 0 drafts

### 8.2 Test AI Draft Generation

1. Find the brief you just created
2. Click **"Generate Draft"**
3. Confirm the credit usage prompt

**Expected Result**: ✅
- Loading/processing message
- After 30-60 seconds, draft is generated
- Credits deducted (check header - should be less than 100 now)
- Success message shows:
  - Credits used
  - SEO score
- Automatically switches to "Drafts" tab

### 8.3 Verify Draft & SEO Score

In the **Drafts** tab, check:

**Expected Result**: ✅
- [ ] Draft appears with title
- [ ] Word count shown (~1500 words)
- [ ] Version shows as v1
- [ ] Status badge shows "DRAFT"
- [ ] SEO Score displayed (0-100)
  - Score 70+ = green
  - Score 40-69 = yellow
  - Score <40 = red

### 8.4 Check Credit Transaction

1. Click **"Credits"** in sidebar
2. View **Transaction History**

**Expected Result**: ✅
- Transaction showing credit deduction
- Reason: "Draft generation with SEO score"
- Negative amount
- Timestamp
- Updated wallet balance

---

## 🧪 Advanced Testing

### Test Multiple Briefs

Create 2-3 more briefs with different topics:
- "How to Start a Blog"
- "Email Marketing Guide"
- "Social Media Strategy"

Generate drafts for each and observe:
- Credit deductions are consistent
- Each draft has unique content
- SEO scores vary based on content quality

### Test Different AI Providers

If you have multiple API keys:

1. Stop the server (Ctrl+C)
2. Change `AI_PROVIDER` in `.env.local` to `"anthropic"` or `"gemini"`
3. Restart: `npm run dev`
4. Generate a new draft
5. Compare output quality and cost

### Test SEO Scoring Edge Cases

Create briefs with:
- Very short word count (500 words)
- Very long word count (3000 words)
- No entities specified
- No FAQs

Observe how SEO scores change.

---

## 🔍 Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`
- Check DATABASE_URL is correct
- Ensure password is URL-encoded
- Verify Supabase project is active
- Check internet connection

**Fix**:
```bash
# Test connection
npx prisma db pull
```

### AI Generation Fails

**Error**: `OpenAI API error`
- Verify API key is correct
- Check you have credits in OpenAI account
- Ensure no typos in `.env.local`

**Error**: `Insufficient credits`
- You've used all 100 trial credits
- Manually add more credits (see below)

### No Credits After Registration

Run seed script again:
```bash
npm run db:seed
```

Or manually add credits using Prisma Studio:
```bash
npx prisma studio
```

1. Go to `CreditWallet` table
2. Find your org's wallet
3. Update `balance` to 1000
4. Save

### Server Won't Start

**Error**: `Port 3000 is already in use`

```bash
# Kill the process on port 3000 (Unix/Mac)
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

---

## 📊 What to Expect - Feature Checklist

### Phase A - Foundations ✅
- [x] User registration with 100 trial credits
- [x] Sign in / Sign out
- [x] Dashboard with stats
- [x] Project creation and management
- [x] Credit wallet display
- [x] Transaction history

### Phase B - Keywords ✅
- [x] Manual keyword entry
- [x] Bulk keyword import
- [x] Keyword list with search
- [x] Difficulty color coding
- [x] Tag display
- [x] Delete keywords

### Phase C - AI Content ✅
- [x] Create content briefs (manual)
- [x] Brief with headings, entities, FAQ
- [x] AI draft generation (OpenAI/Anthropic/Gemini)
- [x] Automatic SEO scoring (0-100)
- [x] SEO checklist (9 categories)
- [x] Credit deduction on generation
- [x] Draft management
- [x] Status tracking (DRAFT, READY, etc.)

---

## 💰 Credit Usage Reference

Based on default pricing matrix (after seeding):

| Action | Cost | Description |
|--------|------|-------------|
| Keyword Fetch | 5 credits | Per 50 keywords |
| Clustering | 10 credits | Per 100 keywords |
| Outline | 5 credits | Per outline |
| Draft (1500 words) | 15 credits | ~15 credits per 1000 words |
| SEO Score | 2 credits | Per score calculation |
| Link Update | 5 credits | Per 10 links |
| Export | 3 credits | Per export bundle |

**Example**: Generating a 1500-word draft with auto SEO score:
- Draft: ~15 credits (1.5k words)
- SEO Score: 2 credits
- **Total**: ~17 credits

With 100 trial credits, you can generate ~5-6 full drafts with SEO scores.

---

## 🎯 Next Steps

After successful testing:

### Option 1: Continue Development (Phase D - Calendar)
- Implement drag-and-drop calendar
- Schedule content
- Link drafts to calendar events

### Option 2: Production Deployment
1. Set up production database (Supabase production)
2. Deploy to Vercel/Netlify
3. Configure production env variables
4. Test in production

### Option 3: Add More Features
- Internal link suggestions (Phase E)
- Export system (Phase G)
- Stripe payments (Phase F)

---

## 🆘 Getting Help

### Check Logs

**Frontend logs** (in terminal):
```bash
npm run dev
```

**Database inspection**:
```bash
npx prisma studio
```

### Common Issues & Solutions

**Q: Draft generation is slow**
A: Normal! AI generation takes 30-90 seconds depending on:
- Word count
- Provider (OpenAI is fastest)
- Network speed

**Q: SEO score seems low**
A: Check the checklist! Common issues:
- Not enough headings (need 1 H1, 3+ H2s)
- Missing entities from brief
- No internal links
- Too few paragraphs

**Q: Can I see the actual draft content?**
A: In the current MVP, drafts are stored in database. Access via:
```bash
npx prisma studio
```
→ ContentDraft table → mdBody field

(A proper draft editor/viewer is planned for Phase C enhancement)

---

## ✅ Success Criteria

Your system is working correctly if:

1. ✅ You can register and receive 100 credits
2. ✅ You can create projects
3. ✅ You can add keywords manually and in bulk
4. ✅ You can create content briefs
5. ✅ You can generate AI drafts (credits deducted)
6. ✅ SEO scores are calculated and displayed
7. ✅ Credit transactions are recorded
8. ✅ All navigation works smoothly

**Congratulations!** You have a working SEO content platform with AI generation! 🎉

---

## 📚 Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Anthropic API Docs**: https://docs.anthropic.com

---

**Last Updated**: November 4, 2025
**Version**: Phase C Complete (40% MVP)
