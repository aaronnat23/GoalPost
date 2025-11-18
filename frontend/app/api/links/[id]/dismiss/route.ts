import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { apiResponse, apiError } from '@/lib/utils/response'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const suggestion = await prisma.internalLinkSuggestion.findFirst({
      where: {
        id: params.id,
        fromDraft: {
          project: {
            org: {
              OR: [
                { ownerUserId: user.id },
                { members: { some: { userId: user.id } } },
              ],
            },
          },
        },
      },
    })

    if (!suggestion) {
      return apiError('Suggestion not found', 404)
    }

    const updated = await prisma.internalLinkSuggestion.update({
      where: { id: suggestion.id },
      data: { dismissed: true },
    })

    return apiResponse({ suggestion: updated })
  } catch (error: any) {
    console.error('Error dismissing link suggestion:', error)
    return apiError(error.message || 'Failed to dismiss suggestion', 500)
  }
}
