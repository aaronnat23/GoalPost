import { NextRequest } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/utils/response'

// GET /api/credits/wallet - Get credit balance
export async function GET() {
  try {
    const user = await getCurrentUser()
    const orgId = user.ownedOrgs[0]?.id || user.orgMemberships[0]?.org.id

    const wallet = await prisma.creditWallet.findUnique({
      where: { orgId },
    })

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await prisma.creditWallet.create({
        data: {
          orgId,
          balance: 0,
          lifetimeSpent: 0,
        },
      })
      return successResponse(newWallet)
    }

    return successResponse(wallet)
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}
