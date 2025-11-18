import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/utils/response'

const createProjectSchema = z.object({
  name: z.string().min(2),
  niche: z.string().optional(),
  locale: z.string().default('en-US'),
  siteName: z.string().optional(),
  targetDomain: z.string().optional(),
})

// GET /api/projects - List all projects for current user's org
export async function GET() {
  try {
    const user = await getCurrentUser()
    const orgId = user.ownedOrgs[0]?.id || user.orgMemberships[0]?.org.id

    const projects = await prisma.project.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        settings: true,
        _count: {
          select: {
            keywords: true,
            contentDrafts: true,
          },
        },
      },
    })

    return successResponse(projects)
  } catch (error: any) {
    return errorResponse(error.message, error.statusCode || 500)
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const orgId = user.ownedOrgs[0]?.id || user.orgMemberships[0]?.org.id

    const body = await request.json()
    const data = createProjectSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        orgId,
        name: data.name,
        niche: data.niche,
        locale: data.locale,
        settings: {
          create: {
            siteName: data.siteName,
            targetDomain: data.targetDomain,
          },
        },
      },
      include: {
        settings: true,
      },
    })

    return successResponse(project, 201)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', error.errors)
    }
    return errorResponse(error.message, error.statusCode || 500)
  }
}
