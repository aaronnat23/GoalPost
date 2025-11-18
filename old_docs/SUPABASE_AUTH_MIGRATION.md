# Supabase Auth Migration Guide

This project has been updated to use **Supabase Auth** instead of NextAuth. This provides:
- ✅ Better integration with Supabase
- ✅ Built-in Google OAuth
- ✅ Built-in email verification
- ✅ Built-in password reset
- ✅ Simpler setup

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/predbnsojefbunhflvmr
2. Click **Settings** (gear icon) → **API**
3. Copy the **anon/public** key (starts with `eyJ...`)

### Step 2: Update `.env.local`

The file `frontend/.env.local` has been created with your database password. Just add:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY="paste-your-anon-key-here"
```

And add your AI API key:

```env
OPENAI_API_KEY="sk-your-openai-key-here"
```

### Step 3: Enable Google OAuth (Optional but Recommended)

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google**
4. Get Google OAuth credentials:
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://predbnsojefbunhflvmr.supabase.co/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**
5. Paste them into Supabase Google provider settings
6. **Save**

### Step 4: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side rendering support
- Other required packages

### Step 5: Set Up Database

```bash
# Push schema to Supabase
npx prisma db push

# Seed with initial data (credit packages, pricing)
npm run db:seed
```

### Step 6: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## ✅ What Changed

### New Files Created

**Supabase Clients**:
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server/API client
- `lib/supabase/middleware.ts` - Middleware client
- `lib/supabase/auth-helpers.ts` - Helper functions

**New Auth API Routes**:
- `app/api/auth/signup/route.ts` - Register new users
- `app/api/auth/signin/route.ts` - Sign in users
- `app/api/auth/signout/route.ts` - Sign out users
- `app/api/auth/session/route.ts` - Get current session

**Auth Callback**:
- `app/auth/callback/route.ts` - Handle OAuth redirects

### Files to Update (Do This Manually)

You need to update these files to use Supabase Auth instead of NextAuth:

#### 1. **Sign In Page** (`app/(auth)/signin/page.tsx`)

Replace the `signIn` import and usage:

**Old**:
```typescript
import { signIn } from 'next-auth/react'
// ...
await signIn('credentials', { email, password, redirect: false })
```

**New**:
```typescript
import { createClient } from '@/lib/supabase/client'
// ...
const supabase = createClient()
await supabase.auth.signInWithPassword({ email, password })
```

#### 2. **Sign Up Page** (`app/(auth)/signup/page.tsx`)

Update to call new signup API:

**Old**:
```typescript
await fetch('/api/auth/register', ...)
await signIn('credentials', ...)
```

**New**:
```typescript
await fetch('/api/auth/signup', ...)
const supabase = createClient()
await supabase.auth.signInWithPassword({ email, password })
```

#### 3. **Middleware** (`middleware.ts`)

Replace NextAuth session check:

**Old**:
```typescript
import { getToken } from 'next-auth/jwt'
const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
```

**New**:
```typescript
import { updateSession } from '@/lib/supabase/middleware'
return await updateSession(request)
```

#### 4. **Dashboard Header** (`components/dashboard/header.tsx`)

Replace session usage:

**Old**:
```typescript
import { useSession, signOut } from 'next-auth/react'
const { data: session } = useSession()
```

**New**:
```typescript
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const [user, setUser] = useState(null)
const supabase = createClient()

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => setUser(data.user))
}, [])
```

#### 5. **All API Routes**

Replace NextAuth session checks:

**Old**:
```typescript
import { getServerSession } from 'next-auth'
const session = await getServerSession(authOptions)
```

**New**:
```typescript
import { requireAuth } from '@/lib/supabase/auth-helpers'
const { user } = await requireAuth()
```

---

## 🧪 Testing

### Test Email/Password Auth

1. Go to http://localhost:3000/signup
2. Fill in: Name, Email, Password
3. Click **Create Account**
4. Should auto-sign-in and redirect to dashboard
5. Check header shows your name and 100 credits

### Test Google OAuth

1. Go to http://localhost:3000/signin
2. Click **Sign in with Google**
3. Select Google account
4. Should redirect to dashboard
5. First time: gets 100 trial credits

### Test Sign Out

1. Click user menu in header
2. Click **Sign Out**
3. Should redirect to home page
4. Try accessing /dashboard → should redirect to signin

---

## 🔍 Troubleshooting

### "Invalid API key"
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Make sure it starts with `eyJ...`
- Get it from Supabase Dashboard → Settings → API

### "Google OAuth not working"
- Ensure you enabled Google provider in Supabase
- Check redirect URI matches exactly
- Make sure Google credentials are correct

### "User not found" after signin
- This is normal first time
- User gets auto-created in Prisma database
- Organization and credits added automatically

### Database connection error
- Password in `.env.local` is URL-encoded: `156423n%40T`
- The `@` is encoded as `%40`

---

## 📖 How It Works

### Authentication Flow

```
1. User signs up/signs in
   ↓
2. Supabase Auth creates/validates user
   ↓
3. Session cookie set automatically
   ↓
4. Our API syncs user to Prisma database
   ↓
5. Organization & credits created (first time)
   ↓
6. User redirected to dashboard
```

### Session Management

- **Client**: `createClient()` from `lib/supabase/client.ts`
- **Server**: `createClient()` from `lib/supabase/server.ts`
- **API**: `requireAuth()` from `lib/supabase/auth-helpers.ts`

### Database Sync

When a user signs in for the first time:
1. Check if user exists in Prisma (`users` table)
2. If not, create user with Supabase ID
3. Create organization (user is owner)
4. Create credit wallet with 100 trial credits
5. Record trial bonus transaction

---

## 🎯 Migration Checklist

- [ ] Get Supabase anon key
- [ ] Update `.env.local` with anon key
- [ ] Add AI API key (OpenAI/Anthropic/Gemini)
- [ ] Run `npm install`
- [ ] Run `npx prisma db push`
- [ ] Run `npm run db:seed`
- [ ] Update signin page to use Supabase
- [ ] Update signup page to use Supabase
- [ ] Update middleware
- [ ] Update dashboard header
- [ ] Update all API routes to use `requireAuth()`
- [ ] Enable Google OAuth in Supabase (optional)
- [ ] Test signup → signin → dashboard flow
- [ ] Test Google OAuth (if enabled)

---

## 💡 Benefits of Supabase Auth

1. **No NextAuth config** - Everything is in Supabase dashboard
2. **Built-in email verification** - Just enable in settings
3. **Built-in password reset** - Works out of the box
4. **Better security** - Supabase handles session tokens
5. **Easier OAuth** - 2-click setup for Google/GitHub/etc
6. **Row Level Security** - Can enable RLS for extra protection
7. **Real-time subscriptions** - Can listen to auth changes

---

## 📚 Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Next.js + Supabase**: https://supabase.com/docs/guides/auth/server-side/nextjs
- **OAuth Setup**: https://supabase.com/docs/guides/auth/social-login
- **Your Dashboard**: https://supabase.com/dashboard/project/predbnsojefbunhflvmr

---

**Last Updated**: November 4, 2025
**Status**: Supabase Auth setup complete - manual file updates needed
