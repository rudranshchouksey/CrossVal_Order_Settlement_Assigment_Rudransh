import Link from 'next/link'
import { ReactNode } from 'react'
import { LayoutDashboard, ReceiptText, LogOut, Package2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-gray-900">
              <Package2 className="w-5 h-5 text-indigo-600" />
              <span>Settlements App</span>
            </Link>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link href="/orders" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                <ReceiptText className="w-4 h-4" />
                <span className="hidden sm:inline">Orders</span>
              </Link>
            </nav>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
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
