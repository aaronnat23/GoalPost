import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { apiResponse, apiError } from '@/lib/utils/response'
import { createExportBundle } from '@/lib/content/export'
import { ExportFormat } from '@prisma/client'

function parseDate(input: string | null, fallback: Date): Date {
  if (!input) return fallback
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }
  return date
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return apiError('projectId is required', 400)
    }

    const start = parseDate(searchParams.get('start'), new Date())
    const end = parseDate(searchParams.get('end'), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30))

    const items = await prisma.calendarItem.findMany({
      where: {
        projectId,
        project: {
          org: {
            OR: [
              { ownerUserId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
        startAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        draft: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledFor: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    })

    return apiResponse({ items })
  } catch (error: any) {
    console.error('Error fetching calendar items:', error)
    return apiError(error.message || 'Failed to fetch calendar', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const {
      projectId,
      title,
      type = 'ARTICLE',
      startAt,
      endAt,
      status = 'scheduled',
      refId,
      metadata,
    } = body

    if (!projectId || !title || !startAt) {
      return apiError('projectId, title, and startAt are required', 400)
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
      return apiError('Project not found or access denied', 404)
    }

    const startDate = new Date(startAt)
    const endDate = endAt ? new Date(endAt) : startDate

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return apiError('Invalid date values', 400)
    }

    const calendarItem = await prisma.calendarItem.create({
      data: {
        projectId,
        title,
        type,
        startAt: startDate,
        endAt: endDate,
        status,
        refId,
        metadata,
      },
      include: {
        draft: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledFor: true,
          },
        },
      },
    })

    if (refId) {
      await prisma.contentDraft.update({
        where: { id: refId },
        data: {
          status: 'SCHEDULED',
          scheduledFor: startDate,
        },
      })

      // Auto-export markdown bundle when scheduling articles
      if (type === 'ARTICLE') {
        createExportBundle({ draftId: refId, format: ExportFormat.MD }).catch((err) =>
          console.error('Auto-export failed:', err)
        )
      }
    }

    return apiResponse({ item: calendarItem }, 201)
  } catch (error: any) {
    console.error('Error creating calendar item:', error)
    return apiError(error.message || 'Failed to create calendar item', 500)
  }
}
