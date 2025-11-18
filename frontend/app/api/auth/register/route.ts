import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db/prisma'
import { successResponse, errorResponse } from '@/lib/utils/response'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return errorResponse('User already exists', 400, 'USER_EXISTS')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user and org in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          emailVerified: new Date(), // Auto-verify for MVP
        },
      })

      // Create default organization
      const org = await tx.org.create({
        data: {
          name: data.orgName || `${data.name}'s Workspace`,
          ownerUserId: user.id,
        },
      })

      // Add user as org owner
      await tx.orgUser.create({
        data: {
          orgId: org.id,
          userId: user.id,
          role: 'OWNER',
          acceptedAt: new Date(),
        },
      })

      // Create credit wallet with free trial credits
      await tx.creditWallet.create({
        data: {
          orgId: org.id,
          balance: 100, // 100 free trial credits
        },
      })

      // Log the trial credits
      await tx.creditTxn.create({
        data: {
          orgId: org.id,
          delta: 100,
          reason: 'TRIAL_BONUS',
          metadata: {
            description: 'Welcome bonus credits',
          },
        },
      })

      return { user, org }
    })

    return successResponse(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        org: {
          id: result.org.id,
          name: result.org.name,
        },
      },
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        error.errors
      )
    }

    console.error('Registration error:', error)
    return errorResponse('Failed to create account', 500)
  }
}
