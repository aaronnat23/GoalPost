// Supabase Auth Helper Functions
import { createClient } from './server'
import { prisma } from '@/lib/db/prisma'

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get or create user in Prisma database from Supabase user
export async function getOrCreatePrismaUser(supabaseUserId: string, email: string, name?: string) {
  // Check if user exists in Prisma
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: supabaseUserId },
        { email: email },
      ],
    },
    include: {
      ownedOrgs: true,
      orgMemberships: { include: { org: true } },
    },
  })

  if (!user) {
    // Create new user and org
    const org = await prisma.org.create({
      data: {
        name: `${name}'s Organization` || `${email}'s Organization`,
        owner: {
          create: {
            id: supabaseUserId,
            email: email,
            name: name,
          },
        },
      },
      include: {
        owner: true,
      },
    })

    // Create credit wallet with trial credits
    await prisma.creditWallet.create({
      data: {
        orgId: org.id,
        balance: 100, // Trial credits
      },
    })

    // Record trial credit transaction
    await prisma.creditTxn.create({
      data: {
        orgId: org.id,
        delta: 100,
        reason: 'TRIAL_BONUS',
        metadata: {
          message: 'Welcome bonus - 100 free credits!',
        },
      },
    })

    user = org.owner
  } else if (user.id !== supabaseUserId) {
    // Update user ID to match Supabase
    user = await prisma.user.update({
      where: { id: user.id },
      data: { id: supabaseUserId },
      include: {
        ownedOrgs: true,
        orgMemberships: { include: { org: true } },
      },
    })
  }

  // Update last login
  await prisma.user.update({
    where: { id: supabaseUserId },
    data: { lastLogin: new Date() },
  })

  return user
}

// Require authentication - use in API routes
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get Prisma user
  const prismaUser = await getOrCreatePrismaUser(
    user.id,
    user.email!,
    user.user_metadata?.name || user.email?.split('@')[0]
  )

  return {
    supabaseUser: user,
    user: prismaUser,
  }
}
