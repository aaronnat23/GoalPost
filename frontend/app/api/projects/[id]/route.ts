import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { checkProjectAccess } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/utils/response'
import { NotFoundError } from '@/lib/utils/errors'

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  niche: z.string().optional(),
  locale: z.string().optional(),
})

// GET /api/projects/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await checkProjectAccess(id)

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        settings: true,
        _count: {
          select: {
            keywords: true,
            topicClusters: true,
            contentDrafts: true,
          },
        },
      },
    })

    if (!project) {
      throw new NotFoundError('Project not found')
    }

    return successResponse(project)
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}

// PATCH /api/projects/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await checkProjectAccess(id, 'ADMIN')

    const body = await request.json()
    const data = updateProjectSchema.parse(body)

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        settings: true,
      },
    })

    return successResponse(project)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', error.errors)
    }
    return errorResponse(error.message, error.statusCode || 500)
  }
}

// DELETE /api/projects/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await checkProjectAccess(id, 'OWNER')

    await prisma.project.delete({
      where: { id },
    })

    return successResponse({ message: 'Project deleted' })
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}
