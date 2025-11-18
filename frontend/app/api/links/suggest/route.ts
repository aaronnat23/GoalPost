// API Route: Generate Internal Link Suggestions
// POST /api/links/suggest - Creates fresh suggestions based on other drafts

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils/response";

function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);
}

function collectEntities(nodes: any[] | null | undefined) {
  if (!Array.isArray(nodes)) return [] as string[]
  return nodes
    .map((node) => {
      if (!node) return ''
      if (typeof node === 'string') return node
      return node.term || node.name || ''
    })
    .filter(Boolean)
}

function scoreSimilarity(
  sourceTokens: string[],
  targetTokens: string[],
  sourceEntities: string[],
  targetEntities: string[],
  dismissed: boolean
) {
  if (!sourceTokens.length || !targetTokens.length) return 0
  const sourceSet = new Set(sourceTokens)
  const targetSet = new Set(targetTokens)
  const overlapTokens = targetTokens.filter((token) => sourceSet.has(token)).length
  const unionSize = sourceSet.size + targetSet.size - overlapTokens
  const tokenScore = overlapTokens / Math.max(1, unionSize)

  const sourceEntitySet = new Set(sourceEntities.map((ent) => ent.toLowerCase()))
  const targetEntitySet = new Set(targetEntities.map((ent) => ent.toLowerCase()))
  let entityOverlap = 0
  targetEntitySet.forEach((ent) => {
    if (sourceEntitySet.has(ent)) entityOverlap += 1
  })
  const entityScore = entityOverlap / Math.max(1, sourceEntitySet.size)

  const dismissedPenalty = dismissed ? 0.75 : 1

  return (tokenScore * 0.6 + entityScore * 0.4) * dismissedPenalty
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const draftId: string | undefined = body?.draftId
    const limit: number = Math.min(body?.limit || 5, 10)

    if (!draftId) {
      return apiError('draftId is required', 400)
    }

    const draft = await prisma.contentDraft.findFirst({
      where: {
        id: draftId,
        project: {
          org: {
            OR: [
              { ownerUserId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        mdBody: true,
        brief: {
          select: {
            targetKeyword: { select: { term: true } },
            headings: true,
            entities: true,
          },
        },
      },
    })

    if (!draft) {
      return apiError('Draft not found or access denied', 404)
    }

    const existingSuggestions = await prisma.internalLinkSuggestion.findMany({
      where: { fromDraftId: draft.id },
      select: { toDraftId: true, accepted: true, dismissed: true },
    })

    const acceptedIds = new Set(existingSuggestions.filter((s) => s.accepted).map((s) => s.toDraftId))
    const dismissedIds = new Set(existingSuggestions.filter((s) => s.dismissed).map((s) => s.toDraftId))

    const candidates = await prisma.contentDraft.findMany({
      where: {
        projectId: draft.projectId,
        id: { not: draft.id },
        status: {
          in: ['READY', 'SCHEDULED', 'EXPORTED', 'PUBLISHED'],
        },
      },
      select: {
        id: true,
        title: true,
        mdBody: true,
        brief: {
          select: {
            targetKeyword: { select: { term: true } },
            headings: true,
            entities: true,
          },
        },
      },
      take: 100,
    })

    const sourceTokens = tokenize(
      [draft.title, draft.brief?.targetKeyword?.term, draft.mdBody].filter(Boolean).join(' ')
    )
    const sourceEntities = collectEntities(draft.brief?.entities)

    const ranked = candidates
      .filter((candidate) => !acceptedIds.has(candidate.id))
      .map((candidate) => {
        const tokens = tokenize(
          [candidate.title, candidate.brief?.targetKeyword?.term, candidate.mdBody]
            .filter(Boolean)
            .join(' ')
        )
        const entities = collectEntities(candidate.brief?.entities)
        const score = scoreSimilarity(
          sourceTokens,
          tokens,
          sourceEntities,
          entities,
          dismissedIds.has(candidate.id)
        )
        return { candidate, score }
      })
      .filter(({ score }) => score > 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    if (ranked.length === 0) {
      await prisma.internalLinkSuggestion.deleteMany({
        where: { fromDraftId: draft.id, accepted: false },
      })
      return apiResponse({ suggestions: [] })
    }

    await prisma.internalLinkSuggestion.deleteMany({
      where: { fromDraftId: draft.id, accepted: false },
    })

    const created = await Promise.all(
      ranked.map(({ candidate, score }) =>
        prisma.internalLinkSuggestion.create({
          data: {
            fromDraftId: draft.id,
            toDraftId: candidate.id,
            anchorText:
              candidate.title || candidate.brief?.targetKeyword?.term || 'Related resource',
            relevanceScore: Number(score.toFixed(3)),
          },
          include: {
            toDraft: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        })
      )
    )

    return apiResponse({ suggestions: created })
  } catch (error: any) {
    console.error('Error generating link suggestions:', error)
    return apiError(error.message || 'Failed to generate link suggestions', 500)
  }
}
