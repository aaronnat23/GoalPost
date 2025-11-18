'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Target,
  FileText,
  CalendarDays,
  WalletMinimal,
  Settings,
  Link2,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Keywords', href: '/dashboard/keywords', icon: Target },
  { name: 'Content', href: '/dashboard/content', icon: FileText },
  { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
  { name: 'Backlinks', href: '/dashboard/backlinks', icon: Link2 },
  { name: 'Credits', href: '/dashboard/credits', icon: WalletMinimal },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
          BetterSEO
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t px-6 py-4 text-xs text-slate-500">
        <div>© {new Date().getFullYear()} BetterSEO</div>
        <div className="mt-1">MVP Preview</div>
      </div>
    </div>
  )
}
