'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, HardHat, Package, Settings, UserRound, Users } from 'lucide-react'
import ThemeToggle from '@/components/theme/ThemeToggle'

interface Tab {
  href: string
  label: string
  icon: typeof FileText
}

const tabs: Tab[] = [
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/catalog', label: 'Catalog', icon: Package },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <HardHat className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">FieldQuote Pro</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Quotes. Signed. Paid.</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Profile"
            className="select-none rounded-full p-2 text-slate-500 transition-transform active:scale-95 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <UserRound className="h-6 w-6" />
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-16">{children}</main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-4">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex select-none flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-transform active:scale-95',
                  active ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <span
                  className={cn(
                    'rounded-xl px-3.5 py-1 transition-colors',
                    active && 'bg-blue-50 dark:bg-blue-950/60'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
