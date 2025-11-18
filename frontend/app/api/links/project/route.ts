import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { apiResponse, apiError } from '@/lib/utils/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status') || 'pending'

    if (!projectId) {
      return apiError('projectId is required', 400)
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        org: {
          OR: [
            { ownerUserId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      },
    })

    if (!project) {
      return apiError('Project not found', 404)
    }

    const whereClause: any = {
      fromDraft: { projectId },
    }

    if (status === 'pending') {
      whereClause.accepted = false
      whereClause.dismissed = false
    } else if (status === 'accepted') {
      whereClause.accepted = true
    }

    const suggestions = await prisma.internalLinkSuggestion.findMany({
      where: whereClause,
      include: {
        fromDraft: { select: { id: true, title: true } },
        toDraft: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiResponse({ suggestions })
  } catch (error: any) {
    console.error('Error fetching project suggestions:', error)
    return apiError(error.message || 'Failed to fetch suggestions', 500)
  }
}
