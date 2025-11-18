import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/utils/response'
import { NotFoundError } from '@/lib/utils/errors'

const updateKeywordSchema = z.object({
  term: z.string().optional(),
  searchVolume: z.number().optional(),
  difficulty: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/keywords/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUser()
    const { id } = await params

    const keyword = await prisma.keyword.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    if (!keyword) {
      throw new NotFoundError('Keyword not found')
    }

    return successResponse(keyword)
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}

// PATCH /api/keywords/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUser()
    const { id } = await params
    const body = await request.json()
    const data = updateKeywordSchema.parse(body)

    const keyword = await prisma.keyword.update({
      where: { id },
      data,
    })

    return successResponse(keyword)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', error.errors)
    }
    return errorResponse(error.message, error.statusCode || 500)
  }
}

// DELETE /api/keywords/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getCurrentUser()
    const { id } = await params

    await prisma.keyword.delete({
      where: { id },
    })

    return successResponse({ message: 'Keyword deleted' })
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}
