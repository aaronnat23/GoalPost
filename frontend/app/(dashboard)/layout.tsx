import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/session'
import prisma from '@/lib/db/prisma'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user
  try {
    user = await getCurrentUser()
  } catch (error) {
    redirect('/signin')
  }

  // Get first org for now (we'll add org switching later)
  const firstOrg = user.ownedOrgs[0] || user.orgMemberships[0]?.org

  if (!firstOrg) {
    // This shouldn't happen as registration creates an org
    redirect('/signin')
  }

  // Get credit wallet
  const wallet = await prisma.creditWallet.findUnique({
    where: { orgId: firstOrg.id },
  })

  // Get first project (if any)
  const projects = await prisma.project.findMany({
    where: { orgId: firstOrg.id },
    orderBy: { createdAt: 'desc' },
  })
  const cookieStore = cookies()
  const storedProjectId = cookieStore.get('activeProjectId')?.value
  const preferredProject = storedProjectId
    ? projects.find((project) => project.id === storedProjectId)
    : null
  const firstProject = preferredProject || projects[0] || null

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          creditBalance={wallet?.balance || 0}
          currentProject={firstProject}
          projects={projects}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
