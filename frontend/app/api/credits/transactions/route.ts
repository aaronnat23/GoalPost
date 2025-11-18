import { NextRequest } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { paginatedResponse, errorResponse } from '@/lib/utils/response'

// GET /api/credits/transactions - Get transaction history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const orgId = user.ownedOrgs[0]?.id || user.orgMemberships[0]?.org.id

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize

    const [transactions, total] = await Promise.all([
      prisma.creditTxn.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.creditTxn.count({
        where: { orgId },
      }),
    ])

    return paginatedResponse(transactions, page, pageSize, total)
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}
