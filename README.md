# SEO Content Platform MVP

> **Better & Cheaper** - AI-powered SEO content creation with drag-and-drop scheduling and credit-based pricing

## 🚀 Quick Start

### For Development (Session 2+)

```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install dependencies (Windows)
install-dependencies.bat

# 3. Set up environment
copy .env.example .env.local
# Edit .env.local with your credentials

# 4. Set up database
npx prisma db push
npx prisma generate

# 5. Start development server
npm run dev
```

Visit http://localhost:3000

### First Time Setup

See [frontend/SETUP.md](frontend/SETUP.md) for detailed setup instructions.

## 📁 Project Structure

```
pseo_tools/
├── frontend/              # Next.js application
│   ├── app/              # Pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Core business logic
│   ├── prisma/           # Database schema
│   ├── types/            # TypeScript types
│   └── SETUP.md          # Detailed setup guide
├── agents.md             # Complete product specification (IMPORTANT!)
├── PROGRESS.md           # Implementation progress tracker
├── SESSION_1_SUMMARY.md  # Latest session summary
└── README.md             # This file
```

## 📋 Important Documents

| Document | Purpose |
|----------|---------|
| **[START_HERE.md](START_HERE.md)** | ⭐ **Quick overview - Start here!** |
| **[PROGRESS.md](PROGRESS.md)** | ⭐ **Main progress tracker** |
| [QUICK_START.md](QUICK_START.md) | 5-minute setup guide |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Supabase configuration |
| [PHASE_A_B_COMPLETE.md](PHASE_A_B_COMPLETE.md) | Detailed feature list |
| [agents.md](agents.md) | Complete product specification |

## ✅ Session 1 Achievements (Nov 4, 2025)

**Status**: Foundation Complete ✅
**Progress**: Phase A - 60% | Overall MVP - 10%
**Files Created**: 28 files
**Time**: 1.5 hours

### What's Built

- ✅ **Next.js 15** project with TypeScript, Tailwind, Turbopack
- ✅ **Complete Database Schema** (15+ models)
  - Users & Organizations
  - Projects & Settings
  - Credits & Billing
  - Keywords & Clusters
  - Content Briefs & Drafts
  - Calendar & Scheduling
  - Jobs & Exports
  - Admin & Audit logs
- ✅ **Authentication System**
  - Auth.js with multiple providers (Google, GitHub, Email)
  - Role-based access control (RBAC)
  - Protected routes with middleware
  - Registration with auto org creation + 100 free credits
- ✅ **Landing Page** - Modern UI showcasing features
- ✅ **Utilities** - Error handling, API responses, type definitions
- ✅ **Documentation** - Comprehensive guides and checklists

## 🎯 What This Platform Does

### MVP Features (Building Now)

1. **Keyword Intelligence** 🎯
   - Import and discover keywords
   - Topic clustering with AI
   - Search intent classification

2. **AI Content Generation** ✍️
   - SEO-optimized content briefs
   - AI-powered outlines and drafts
   - Multiple writing styles (Neutral, Conversational, Technical)

3. **SEO Scoring** 📊
   - Real-time on-page analysis
   - 0-100 SEO score
   - Actionable optimization checklist

4. **Internal Linking** 🔗
   - Smart link suggestions
   - Topical relevance scoring
   - One-click insertion

5. **Calendar Scheduling** 📅
   - Drag-and-drop interface
   - Content planning
   - Export scheduling

6. **Credit System** 💰
   - Pay-as-you-go pricing
   - No subscriptions
   - Usage metering per action

### Post-MVP (Future)

- Social media posting (Instagram, Facebook, LinkedIn, TikTok, etc.)
- CMS integrations (WordPress, Shopify, Ghost, Webflow)
- Analytics integrations
- Team collaboration features
- Backlink outreach tools

## 🛠️ Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Turbopack

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Redis + BullMQ (job queues)

### Authentication
- Auth.js (NextAuth)
- JWT sessions
- OAuth providers

### AI
- Pluggable provider system
- OpenAI / Anthropic / Gemini support

### Infrastructure
- S3-compatible storage (exports)
- Stripe (payments)
- Sentry (error tracking)

## 📊 Progress Tracker

Track progress in [PROGRESS.md](PROGRESS.md):

- ✅ **Phase A - Foundations** (60%)
  - Project setup, database, authentication
- ⏳ **Phase B - Keywords & Clustering** (0%)
- ⏳ **Phase C - AI Content Generation** (0%)
- ⏳ **Phase D - Calendar & Scheduling** (0%)
- ⏳ **Phase E - Backlink System** (0%)
- ⏳ **Phase F - Credits & Billing** (0%)
- ⏳ **Phase G - Export System** (0%)
- ⏳ **Phase H - Teams & Permissions** (0%)
- ⏳ **Phase I - Admin Console** (0%)
- ⏳ **Phase J - Production** (0%)

**Overall**: ~10% complete (10/100+ tasks)

## 🎨 Design Principles

1. **Better**: Higher quality content through AI assistance
2. **Cheaper**: Credit-based pricing vs expensive subscriptions
3. **Intuitive**: Drag-and-drop calendar, clean UI
4. **Transparent**: Clear credit costs, no hidden fees
5. **Ethical**: Relevance-first linking, no spam

## 💳 Pricing Model

| Package | Price | Credits | ~Articles |
|---------|-------|---------|-----------|
| Starter | $15 | 300 | ~15 |
| Professional | $49 | 1,200 | ~60 |
| Enterprise | $199 | 5,000 | ~250 |

**Free Trial**: 100 credits (enough for ~5 articles)

### Credit Costs

- Keyword fetch: Per 50 terms
- Clustering: Per 100 keywords
- Brief: Per brief
- Outline: Per outline
- Draft: Per 1K words
- SEO score: Per run
- Export: Per file

## 📦 Next Session Plan (Session 2)

### Goals
1. Install all dependencies
2. Set up PostgreSQL + Redis
3. Create auth UI pages (sign in/up)
4. Build dashboard layout
5. Org/Project management
6. Display credit balance
7. Test full auth flow

### Estimated Time
2-3 hours

## 🔗 Key Links

### Development
- **Local**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Prisma Studio**: `npx prisma studio`

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Auth.js Docs](https://authjs.dev)
- [Tailwind Docs](https://tailwindcss.com/docs)

## 🤝 Contributing

This is a private MVP project. Follow the implementation plan in [agents.md](agents.md).

## 📝 License

Private project. All rights reserved.

---

## Need Help?

1. **Setup Issues**: See [frontend/SETUP.md](frontend/SETUP.md)
2. **Feature Specs**: See [agents.md](agents.md)
3. **Progress**: See [PROGRESS.md](PROGRESS.md)
4. **Latest Work**: See [SESSION_1_SUMMARY.md](SESSION_1_SUMMARY.md)

---

**Built with Claude Code** - Session 1: Nov 4, 2025
**Status**: Foundation Complete, Ready for Session 2 ✅
