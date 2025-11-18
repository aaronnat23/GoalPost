import { NextRequest } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getCurrentUser, checkProjectAccess } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/utils/response'

// GET /api/keywords/stats - Get keyword statistics for a project
export async function GET(request: NextRequest) {
  try {
    await getCurrentUser()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return errorResponse('projectId is required', 400)
    }

    await checkProjectAccess(projectId)

    const [total, bySource, avgDifficulty, topKeywords] = await Promise.all([
      // Total keywords
      prisma.keyword.count({ where: { projectId } }),

      // By source
      prisma.keyword.groupBy({
        by: ['source'],
        where: { projectId },
        _count: true,
      }),

      // Average difficulty
      prisma.keyword.aggregate({
        where: { projectId, difficulty: { not: null } },
        _avg: { difficulty: true },
      }),

      // Top keywords by search volume
      prisma.keyword.findMany({
        where: { projectId, searchVolume: { not: null } },
        orderBy: { searchVolume: 'desc' },
        take: 10,
        select: {
          id: true,
          term: true,
          searchVolume: true,
          difficulty: true,
        },
      }),
    ])

    const stats = {
      total,
      bySource: bySource.reduce((acc, item) => {
        acc[item.source] = item._count
        return acc
      }, {} as Record<string, number>),
      avgDifficulty: avgDifficulty._avg.difficulty || 0,
      topKeywords,
    }

    return successResponse(stats)
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}
