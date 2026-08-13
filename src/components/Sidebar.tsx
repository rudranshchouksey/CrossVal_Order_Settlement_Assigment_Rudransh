'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, ReceiptText, LogOut, Menu, X, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ReceiptText },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Landmark className="h-4 w-4" />
          Settlements
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r bg-sidebar transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Landmark className="h-4 w-4 text-foreground" />
          <span className="text-sm font-semibold tracking-tight text-foreground">Settlements</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-3" aria-label="Main navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t px-3 py-3">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-destructive"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
