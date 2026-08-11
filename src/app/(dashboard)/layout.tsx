import Link from 'next/link'
import { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Settlements App</h1>
            <nav className="hidden md:flex gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/orders" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Orders
              </Link>
            </nav>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Logout
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
