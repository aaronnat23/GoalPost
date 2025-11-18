# SEO Platform Frontend - Setup Guide

This guide will help you set up the development environment for the SEO Content Platform MVP.

## Prerequisites

- **Node.js** 22.16.0+ and npm 10.9.2+
- **PostgreSQL** 14+ (or use a cloud provider like Supabase/Neon)
- **Redis** 6+ (or use Upstash for serverless Redis)
- Git

## Step 1: Install Dependencies

Run the batch file to install all necessary packages:

```bash
# In Windows Command Prompt or PowerShell
cd frontend
install-dependencies.bat
```

Or manually install with npm:

```bash
npm install
```

## Step 2: Set Up PostgreSQL Database

### Option A: Local PostgreSQL

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a new database:

```sql
CREATE DATABASE seo_platform;
CREATE USER seo_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE seo_platform TO seo_user;
```

### Option B: Cloud Database (Recommended for quick start)

**Supabase** (Free tier available):
1. Go to https://supabase.com
2. Create a new project
3. Copy the PostgreSQL connection string

**Neon** (Free tier available):
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string

## Step 3: Set Up Redis

### Option A: Local Redis

**Windows** (using WSL):
```bash
# In WSL
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

**Or use Docker**:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Option B: Upstash Redis (Recommended for quick start)

1. Go to https://upstash.com
2. Create a new Redis database
3. Copy the Redis URL

## Step 4: Configure Environment Variables

1. Copy the example environment file:

```bash
copy .env.example .env.local
```

2. Edit `.env.local` and fill in your values:

```env
# Minimum required for local development:
DATABASE_URL="postgresql://seo_user:your_password@localhost:5432/seo_platform"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Generate NEXTAUTH_SECRET with:
# openssl rand -base64 32
```

## Step 5: Initialize Prisma and Create Database Schema

```bash
# Initialize Prisma (if not already done)
npx prisma init

# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed
```

## Step 6: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see your application!

## Step 7: Run Worker Process (for background jobs)

In a separate terminal:

```bash
npm run worker
```

This will start the BullMQ worker that processes background jobs like:
- Keyword fetching
- Topic clustering
- AI content generation
- SEO scoring
- Export generation

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Dashboard pages (protected)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── keywords/         # Keyword management
│   ├── content/          # Content editor & brief
│   ├── calendar/         # Calendar UI
│   └── admin/            # Admin panel
├── lib/                   # Core business logic
│   ├── auth/             # Authentication utilities
│   ├── db/               # Database utilities & Prisma client
│   ├── ai/               # AI provider integrations
│   ├── jobs/             # Background job definitions
│   ├── utils/            # Helper functions
│   └── validations/      # Zod schemas
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed/             # Seed data scripts
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Development Workflow

### Making Database Changes

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Apply migration: `npx prisma migrate deploy`

### Adding New Features

1. Define data model in Prisma schema
2. Create API routes in `app/api/`
3. Build UI components in `components/`
4. Add pages in `app/(dashboard)/`
5. Implement background jobs in `lib/jobs/`

### Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Type check
npm run type-check
```

## Common Issues

### Port 3000 already in use
```bash
# Kill the process using port 3000
npx kill-port 3000
```

### Prisma Client not generated
```bash
npx prisma generate
```

### Database connection issues
- Check your DATABASE_URL in .env.local
- Ensure PostgreSQL is running
- Verify credentials and database exists

### Redis connection issues
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_URL in .env.local

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma studio       # Open Prisma Studio (DB GUI)
npx prisma db push      # Push schema changes
npx prisma migrate dev  # Create migration
npx prisma generate     # Generate Prisma Client

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code (if Prettier installed)
npm run type-check      # TypeScript check
```

## API Documentation

API routes follow RESTful conventions:

- `/api/auth/*` - Authentication endpoints
- `/api/keywords/*` - Keyword management
- `/api/clusters/*` - Topic clustering
- `/api/briefs/*` - Content briefs
- `/api/drafts/*` - Content drafts
- `/api/calendar/*` - Calendar items
- `/api/credits/*` - Credit management
- `/api/admin/*` - Admin operations

## Environment Variables Reference

See `.env.example` for a complete list of available environment variables.

### Required for Basic Development
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - Auth.js secret key
- `NEXTAUTH_URL` - Application URL

### Required for AI Features
At least one:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_GEMINI_API_KEY`

### Required for Credit Purchases
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Required for Exports
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`

## Next Steps

1. Complete this setup
2. Review `../PROGRESS.md` for implementation status
3. Review `../agents.md` for complete product specification
4. Start with Phase A tasks (Foundations)
5. Build incrementally, testing each feature

## Getting Help

- Check `../PROGRESS.md` for implementation checklist
- Review `../agents.md` for detailed specs
- Check Next.js docs: https://nextjs.org/docs
- Check Prisma docs: https://www.prisma.io/docs
- Check Auth.js docs: https://authjs.dev

---

Happy coding!
