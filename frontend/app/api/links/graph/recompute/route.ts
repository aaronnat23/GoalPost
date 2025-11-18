import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { apiResponse, apiError } from '@/lib/utils/response'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const projectId: string | undefined = body?.projectId

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
      select: { id: true },
    })

    if (!project) {
      return apiError('Project not found or access denied', 404)
    }

    const [outgoing, incoming] = await Promise.all([
      prisma.internalLinkSuggestion.groupBy({
        by: ['fromDraftId'],
        where: {
          fromDraft: { projectId },
          accepted: true,
          dismissed: false,
        },
        _count: { fromDraftId: true },
      }),
      prisma.internalLinkSuggestion.groupBy({
        by: ['toDraftId'],
        where: {
          toDraft: { projectId },
          accepted: true,
          dismissed: false,
        },
        _count: { toDraftId: true },
      }),
    ])

    const outgoingMap = new Map(outgoing.map((row) => [row.fromDraftId, row._count.fromDraftId]))
    const incomingMap = new Map(incoming.map((row) => [row.toDraftId, row._count.toDraftId]))

    const drafts = await prisma.contentDraft.findMany({
      where: { projectId },
      select: { id: true },
    })

    await prisma.$transaction([
      prisma.linkGraphSnapshot.deleteMany({ where: { projectId } }),
      prisma.linkGraphSnapshot.createMany({
        data: drafts.map((draft) => ({
          projectId,
          draftId: draft.id,
          incomingCount: incomingMap.get(draft.id) || 0,
          outgoingCount: outgoingMap.get(draft.id) || 0,
        })),
      }),
    ])

    return apiResponse({
      projectId,
      nodes: drafts.length,
      stats: {
        totalIncoming: Array.from(incomingMap.values()).reduce((acc, value) => acc + value, 0),
        totalOutgoing: Array.from(outgoingMap.values()).reduce((acc, value) => acc + value, 0),
      },
    })
  } catch (error: any) {
    console.error('Error recomputing link graph:', error)
    return apiError(error.message || 'Failed to recompute link graph', 500)
  }
}
