// Auth Callback Route - Handles OAuth redirects from Supabase
import { createClient } from '@/lib/auth/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Sync user to Prisma database (create if doesn't exist)
      const existingUser = await prisma.user.findUnique({
        where: { id: data.user.id },
      })

      if (!existingUser) {
        // Create new user in Prisma database
        const userName = data.user.user_metadata?.name ||
                        data.user.user_metadata?.full_name ||
                        data.user.email?.split('@')[0] ||
                        'User'

        const orgName = `${userName}'s Organization`

        // Create user with organization and initial credits
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            name: userName,
            ownedOrgs: {
              create: {
                name: orgName,
                creditWallet: {
                  create: {
                    balance: 100, // 100 free trial credits
                  },
                },
                creditTxns: {
                  create: {
                    delta: 100,
                    reason: 'PURCHASE',
                    metadata: {
                      description: 'Welcome bonus - 100 free credits',
                    },
                  },
                },
              },
            },
          },
        })
      }
    }
  }

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
