import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { apiResponse, apiError } from '@/lib/utils/response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const item = await prisma.calendarItem.findFirst({
      where: {
        id: params.id,
        project: {
          org: {
            OR: [
              { ownerUserId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      },
    })

    if (!item) {
      return apiError('Calendar item not found', 404)
    }

    const body = await request.json()
    const updates: any = {}

    if (body.title !== undefined) updates.title = body.title
    if (body.type !== undefined) updates.type = body.type
    if (body.status !== undefined) updates.status = body.status
    if (body.startAt) {
      const startDate = new Date(body.startAt)
      if (!Number.isNaN(startDate.getTime())) {
        updates.startAt = startDate
      }
    }
    if (body.endAt) {
      const endDate = new Date(body.endAt)
      if (!Number.isNaN(endDate.getTime())) {
        updates.endAt = endDate
      }
    }
    if (body.metadata !== undefined) updates.metadata = body.metadata
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo

    const updated = await prisma.calendarItem.update({
      where: { id: item.id },
      data: updates,
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

    if (item.refId && (updates.startAt || updates.status)) {
      await prisma.contentDraft.update({
        where: { id: item.refId },
        data: {
          scheduledFor: updates.startAt || item.startAt,
          status: updates.status === 'cancelled' ? 'READY' : 'SCHEDULED',
        },
      })
    }

    return apiResponse({ item: updated })
  } catch (error: any) {
    console.error('Error updating calendar item:', error)
    return apiError(error.message || 'Failed to update calendar item', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const item = await prisma.calendarItem.findFirst({
      where: {
        id: params.id,
        project: {
          org: {
            OR: [
              { ownerUserId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
        },
      },
    })

    if (!item) {
      return apiError('Calendar item not found', 404)
    }

    await prisma.calendarItem.delete({ where: { id: item.id } })

    if (item.refId) {
      await prisma.contentDraft.update({
        where: { id: item.refId },
        data: {
          status: 'READY',
          scheduledFor: null,
        },
      })
    }

    return apiResponse({ message: 'Calendar item removed' })
  } catch (error: any) {
    console.error('Error deleting calendar item:', error)
    return apiError(error.message || 'Failed to delete calendar item', 500)
  }
}
