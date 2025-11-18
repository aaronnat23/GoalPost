// Session utilities for Supabase Auth
import { createClient, getSession as getSupabaseSession, getUser } from './supabase-server'
import { UnauthorizedError, ForbiddenError } from '@/lib/utils/errors'
import prisma from '@/lib/db/prisma'

export async function getSession() {
  return await getSupabaseSession()
}

export async function getCurrentUser() {
  const user = await getUser()

  if (!user) {
    throw new UnauthorizedError()
  }

  // Get user details from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      ownedOrgs: {
        select: {
          id: true,
          name: true,
        },
      },
      orgMemberships: {
        select: {
          org: {
            select: {
              id: true,
              name: true,
            },
          },
          role: true,
        },
      },
    },
  })

  if (!dbUser) {
    throw new UnauthorizedError()
  }

  return dbUser
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    throw new UnauthorizedError()
  }

  return session
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Admin access required')
  }

  return user
}

export async function checkOrgAccess(orgId: string, requiredRole?: string) {
  const user = await getCurrentUser()

  // Super admins have access to everything
  if (user.role === 'SUPER_ADMIN') {
    return true
  }

  // Check if user owns the org
  const ownsOrg = user.ownedOrgs.some((org) => org.id === orgId)
  if (ownsOrg) return true

  // Check if user is a member
  const membership = user.orgMemberships.find(
    (m) => m.org.id === orgId
  )

  if (!membership) {
    throw new ForbiddenError('You do not have access to this organization')
  }

  if (requiredRole) {
    const roleHierarchy = ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']
    const userRoleLevel = roleHierarchy.indexOf(membership.role)
    const requiredRoleLevel = roleHierarchy.indexOf(requiredRole)

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenError(`${requiredRole} role required`)
    }
  }

  return true
}

export async function checkProjectAccess(projectId: string, requiredRole?: string) {
  const user = await getCurrentUser()

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { orgId: true },
  })

  if (!project) {
    throw new ForbiddenError('Project not found')
  }

  return checkOrgAccess(project.orgId, requiredRole)
}
