import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getCurrentUser, checkProjectAccess } from '@/lib/auth/session'
import { successResponse, errorResponse, paginatedResponse } from '@/lib/utils/response'

const createKeywordSchema = z.object({
  projectId: z.string(),
  term: z.string().min(1),
  source: z.enum(['SEED', 'IMPORT', 'SUGGEST', 'SERP']).default('SEED'),
  searchVolume: z.number().optional(),
  difficulty: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).default([]),
})

const bulkImportSchema = z.object({
  projectId: z.string(),
  keywords: z.array(z.object({
    term: z.string(),
    searchVolume: z.number().optional(),
    difficulty: z.number().optional(),
    tags: z.array(z.string()).optional(),
  })),
})

// GET /api/keywords - List keywords
export async function GET(request: NextRequest) {
  try {
    await getCurrentUser()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const skip = (page - 1) * pageSize

    if (!projectId) {
      return errorResponse('projectId is required', 400)
    }

    await checkProjectAccess(projectId)

    const where: any = { projectId }

    if (search) {
      where.term = {
        contains: search,
        mode: 'insensitive',
      }
    }

    const [keywords, total] = await Promise.all([
      prisma.keyword.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.keyword.count({ where }),
    ])

    return paginatedResponse(keywords, page, pageSize, total)
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}

// POST /api/keywords - Create single or bulk keywords
export async function POST(request: NextRequest) {
  try {
    await getCurrentUser()
    const body = await request.json()

    // Check if it's bulk import
    if (body.keywords && Array.isArray(body.keywords)) {
      const data = bulkImportSchema.parse(body)
      await checkProjectAccess(data.projectId, 'EDITOR')

      const keywords = await prisma.keyword.createMany({
        data: data.keywords.map(kw => ({
          projectId: data.projectId,
          term: kw.term,
          source: 'IMPORT',
          searchVolume: kw.searchVolume,
          difficulty: kw.difficulty,
          tags: kw.tags || [],
        })),
        skipDuplicates: true,
      })

      return successResponse({
        imported: keywords.count,
        message: `Successfully imported ${keywords.count} keywords`,
      }, 201)
    }

    // Single keyword
    const data = createKeywordSchema.parse(body)
    await checkProjectAccess(data.projectId, 'EDITOR')

    const keyword = await prisma.keyword.create({
      data,
    })

    return successResponse(keyword, 201)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', error.errors)
    }
    return errorResponse(error.message, error.statusCode || 500)
  }
}
