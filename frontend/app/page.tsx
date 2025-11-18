import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Target,
  PenSquare,
  CalendarDays,
  BarChart3,
  Link2,
  WalletMinimal,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react'

export default async function HomePage() {
  const session = await getSession()

  // If logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  const featureCards = [
    {
      title: 'Keyword Intelligence',
      description: 'Import keywords, discover related terms, and cluster them by topic and intent',
      icon: Target,
    },
    {
      title: 'AI Content Generation',
      description: 'Generate SEO-optimized briefs, outlines, and full drafts with AI assistance',
      icon: PenSquare,
    },
    {
      title: 'Drag-and-Drop Calendar',
      description: 'Schedule content with an intuitive calendar interface inspired by best-in-class tools',
      icon: CalendarDays,
    },
    {
      title: 'SEO Scoring',
      description: 'Real-time SEO analysis with on-page checklist and optimization recommendations',
      icon: BarChart3,
    },
    {
      title: 'Internal Linking',
      description: 'Smart internal link suggestions based on topical relevance and content strategy',
      icon: Link2,
    },
    {
      title: 'Credit-Based Pricing',
      description: 'Pay only for what you use. No expensive monthly subscriptions.',
      icon: WalletMinimal,
    },
  ]

  const heroStats = [
    { label: 'Avg. SEO score', value: '92', detail: '+5 vs last month' },
    { label: 'Drafts generated', value: '1.4k', detail: 'Past 30 days' },
    { label: 'Credits saved', value: '$8,900', detail: 'vs agency rates' },
  ]

  const differentiators = [
    {
      title: 'Human-in-the-loop quality',
      copy: 'Inline editor, live scoring, and internal link approvals keep AI outputs accountable.',
      icon: ShieldCheck,
    },
    {
      title: 'Frictionless automation',
      copy: 'Drag-and-drop calendar, auto-status updates, and credit metering remove busywork.',
      icon: Zap,
    },
    {
      title: 'Predictable pricing',
      copy: 'Credits only move when work ships, so experimentation stays budget-friendly.',
      icon: WalletMinimal,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-900">BetterSEO</div>
          <div className="flex gap-4">
            <Link
              href="/signin"
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-white shadow-2xl">
          <div className="absolute inset-y-0 left-0 w-1/2 blur-3xl opacity-30 animate-float-soft" style={{ background: 'radial-gradient(circle at 20% 20%, #38bdf8, transparent 55%)' }} />
          <div className="absolute inset-y-0 right-0 w-1/2 blur-3xl opacity-30 animate-float-soft" style={{ animationDelay: '4s', background: 'radial-gradient(circle at 80% 20%, #818cf8, transparent 55%)' }} />
          <div className="relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
                <Sparkles className="h-3.5 w-3.5" /> Credit-smart SEO production
              </div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Ship production-ready SEO content without agency costs.
              </h1>
              <p className="text-base text-white/70">
                BetterSEO pairs AI-assisted briefs and drafts with on-page scoring, ethical internal linking, and a drag-and-drop calendar so teams can plan, create, and schedule in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View Product Tour
                </Link>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur">
              {heroStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div>
                    <p className="text-white/60">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-200">{stat.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-24 grid gap-8 md:grid-cols-3">
          {featureCards.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl animate-fade-up"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <div className="mb-4 inline-flex rounded-full bg-slate-100 p-3 text-slate-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* Differentiators */}
        <div className="mt-24 grid gap-6 lg:grid-cols-3">
          {differentiators.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm animate-fade-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <Icon className="mb-4 h-6 w-6 text-slate-700" />
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.copy}</p>
              </div>
            )
          })}
        </div>

        {/* Pricing Preview */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 mb-12">Buy credits as you need them. No subscriptions. No surprises.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[['Starter', '$15', '300 credits', ['~15 article drafts', 'Keyword clustering', 'SEO scoring']],
              ['Professional', '$49', '1200 credits', ['~60 article drafts', 'All features', 'Priority support']],
              ['Enterprise', '$199', '5000 credits', ['~250 article drafts', 'Team collaboration', 'Custom integrations']]].map((tier, index) => (
              <div
                key={tier[0] as string}
                className={cn(
                  'rounded-2xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl',
                  index === 1 ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                )}
              >
                {index === 1 && <div className="text-xs font-semibold text-blue-600 mb-2">POPULAR</div>}
                <h3 className="text-lg font-semibold text-slate-900">{tier[0]}</h3>
                <div className="text-3xl font-bold text-slate-900 my-4">{tier[1]}</div>
                <p className="text-sm text-slate-500 mb-4">{tier[2]}</p>
                <ul className="text-sm text-slate-600 space-y-2">
                  {(tier[3] as string[]).map((benefit) => (
                    <li key={benefit}>• {benefit}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 SEO Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
