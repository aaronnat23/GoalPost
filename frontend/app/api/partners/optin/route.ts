import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { apiResponse, apiError } from '@/lib/utils/response'

function resolveOrgId(user: Awaited<ReturnType<typeof getCurrentUser>>, provided?: string) {
  if (provided) return provided
  return user.ownedOrgs[0]?.id || user.orgMemberships[0]?.org.id
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const orgId = resolveOrgId(user, searchParams.get('orgId') || undefined)

    if (!orgId) {
      return apiError('Organization not found', 404)
    }

    const optIn = await prisma.partnerOptin.findFirst({
      where: { orgId },
    })

    if (optIn) {
      return apiResponse({ optIn })
    }

    return apiResponse({
      optIn: {
        id: 'new',
        orgId,
        domainsAllowed: [],
        rules: { maxLinksPerArticle: 3, topicalMatchRequired: true },
        active: false,
      },
    })
  } catch (error: any) {
    console.error('Error loading partner opt-in:', error)
    return apiError(error.message || 'Failed to load partner preferences', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const orgId = resolveOrgId(user, body?.orgId)

    if (!orgId) {
      return apiError('Organization not found', 404)
    }

    const data = {
      orgId,
      domainsAllowed: body?.domainsAllowed || [],
      rules: body?.rules || {},
      active: Boolean(body?.active),
    }

    const optIn = await prisma.partnerOptin.upsert({
      where: { orgId },
      create: data,
      update: data,
    })

    return apiResponse({ optIn })
  } catch (error: any) {
    console.error('Error saving partner opt-in:', error)
    return apiError(error.message || 'Failed to save partner preferences', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const orgId = resolveOrgId(user, body?.orgId)

    if (!orgId) {
      return apiError('Organization not found', 404)
    }

    const optIn = await prisma.partnerOptin.update({
      where: { orgId },
      data: {
        domainsAllowed: body?.domainsAllowed,
        rules: body?.rules,
        active: body?.active,
      },
    })

    return apiResponse({ optIn })
  } catch (error: any) {
    console.error('Error updating partner opt-in:', error)
    return apiError(error.message || 'Failed to update partner preferences', 500)
  }
}
