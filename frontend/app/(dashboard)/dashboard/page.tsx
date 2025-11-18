import { getCurrentUser } from '@/lib/auth/session'
import prisma from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Target,
  FileText,
  WalletMinimal,
  CalendarDays,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Get user's first org
  const firstOrg = user.ownedOrgs[0] || user.orgMemberships[0]?.org

  // Get stats
  const [projectCount, keywordCount, draftCount, wallet] = await Promise.all([
    prisma.project.count({ where: { orgId: firstOrg.id } }),
    prisma.keyword.count({
      where: { project: { orgId: firstOrg.id } },
    }),
    prisma.contentDraft.count({
      where: { project: { orgId: firstOrg.id } },
    }),
    prisma.creditWallet.findUnique({
      where: { orgId: firstOrg.id },
    }),
  ])

  // Get recent activity
  const recentDrafts = await prisma.contentDraft.findMany({
    where: { project: { orgId: firstOrg.id } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      project: { select: { name: true } },
    },
  })

  const stats = [
    {
      title: 'Projects',
      value: projectCount,
      icon: LayoutDashboard,
      href: '/dashboard/settings/projects',
    },
    {
      title: 'Keywords',
      value: keywordCount,
      icon: Target,
      href: '/dashboard/keywords',
    },
    {
      title: 'Drafts',
      value: draftCount,
      icon: FileText,
      href: '/dashboard/content',
    },
    {
      title: 'Credits',
      value: wallet?.balance || 0,
      icon: WalletMinimal,
      href: '/dashboard/credits',
    },
  ]

  const workflowInsights = [
    {
      label: 'Briefs in review',
      value: 12,
      change: '+3 vs last week',
      percent: 64,
      bar: 'bg-emerald-500',
    },
    {
      label: 'Drafts ready for QA',
      value: 8,
      change: 'steady',
      percent: 48,
      bar: 'bg-blue-500',
    },
    {
      label: 'Scheduled exports',
      value: 4,
      change: '+1 upcoming',
      percent: 32,
      bar: 'bg-violet-500',
    },
  ]

  const upcoming = [
    { label: 'Calendar items this week', value: '9', detail: '3 ready for export' },
    { label: 'Credits remaining', value: (wallet?.balance || 0).toLocaleString(), detail: 'Recharge recommended at 1,000' },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 px-6 py-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wider text-white/80">
              <Sparkles className="h-3.5 w-3.5" /> Workflow pulse
            </div>
            <h1 className="mt-3 text-3xl font-semibold">Welcome back, {user.name || 'team'}.</h1>
            <p className="text-sm text-white/70">
              Track pipeline health, keep credits in check, and keep drafts moving toward export.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {upcoming.map((tile) => (
              <div key={tile.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-white/60">{tile.label}</p>
                <p className="text-2xl font-semibold text-white">{tile.value}</p>
                <p className="text-xs text-white/60">{tile.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card
                className={cn(
                  'group cursor-pointer border-slate-200 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-slate-300',
                  'animate-fade-up'
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </CardTitle>
                    <CardDescription className="text-2xl font-semibold text-slate-900">
                      {stat.value.toLocaleString()}
                    </CardDescription>
                  </div>
                  <span className="rounded-full bg-slate-100 p-3 text-slate-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-xs font-medium text-slate-500">
                    View details
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Pipeline health</CardTitle>
              <CardDescription>Monitor each step from brief to scheduled export.</CardDescription>
            </div>
            <div className="flex items-center text-xs font-medium text-emerald-600">
              <TrendingUp className="mr-1 h-4 w-4" /> +8% throughput week over week
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowInsights.map((insight) => (
              <div key={insight.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>{insight.label}</span>
                  <span className="text-slate-900">{insight.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={cn('h-full rounded-full', insight.bar)}
                    style={{ width: `${insight.percent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{insight.change}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Upcoming milestones</CardTitle>
            <CardDescription>Clear blockers before publish dates slip.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDrafts.slice(0, 3).map((draft) => (
              <div key={draft.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{draft.title || 'Untitled draft'}</p>
                  <span className="text-xs uppercase tracking-wide text-slate-400">{draft.status}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {draft.project.name} • {formatDate(draft.createdAt)}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-8 px-2 text-xs"
                  asChild
                >
                  <Link href={`/dashboard/content/drafts/${draft.id}`}>Open draft</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your content workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/keywords">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Target className="h-4 w-4" />
              Import Keywords
            </Button>
          </Link>
          <Link href="/dashboard/content">
            <Button variant="outline" className="w-full justify-start gap-2">
              <FileText className="h-4 w-4" />
              Create Content Brief
            </Button>
          </Link>
          <Link href="/dashboard/calendar">
            <Button variant="outline" className="w-full justify-start gap-2">
              <CalendarDays className="h-4 w-4" />
              View Calendar
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Drafts */}
      <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle>Recent Drafts</CardTitle>
          <CardDescription>
            Your latest content pieces
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentDrafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No drafts yet. Create your first content brief!</p>
              <Link href="/dashboard/content">
                <Button className="mt-4">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  <div>
                    <h4 className="font-medium">
                      {draft.title || 'Untitled Draft'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {draft.project.name} • {draft.wordCount} words • {draft.status}
                    </p>
                  </div>
                  <Link href={`/dashboard/content/drafts/${draft.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
