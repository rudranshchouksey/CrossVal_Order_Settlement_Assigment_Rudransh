import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { listOrders } from '@/services/orders'
import { calculateAmountPaid, calculateAmountDue, calculateOrderStatus, OrderStatus } from '@/lib/calculations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { InboxIcon } from 'lucide-react'

export default async function OrdersPage(props: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireAuth()
  const searchParams = await props.searchParams
  const statusFilter = searchParams.status

  const allOrders = await listOrders(user.id)

  const mappedOrders = allOrders.map(order => {
    const amountPaid = calculateAmountPaid(order.payments || [])
    const amountDue = calculateAmountDue(order.orderTotal, amountPaid)
    const status = calculateOrderStatus(order.orderTotal, amountPaid, order.dueDate)

    return { ...order, amountPaid, amountDue, status }
  })

  const orders = statusFilter 
    ? mappedOrders.filter(o => o.status === statusFilter)
    : mappedOrders

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h2>
        <Link href="/orders/new" className={buttonVariants({ variant: 'default' })}>
          Create Order
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/orders" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border shadow-sm'}`}>All</Link>
        <Link href="/orders?status=pending" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === 'pending' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border shadow-sm'}`}>Pending</Link>
        <Link href="/orders?status=partially_paid" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === 'partially_paid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border shadow-sm'}`}>Partially Paid</Link>
        <Link href="/orders?status=paid" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === 'paid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border shadow-sm'}`}>Paid</Link>
        <Link href="/orders?status=overdue" className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === 'overdue' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border shadow-sm'}`}>Overdue</Link>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Order Total</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Amount Paid</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Amount Due</TableHead>
                <TableHead className="font-semibold text-gray-900">Due Date</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 space-y-3">
                      <div className="bg-gray-100 p-3 rounded-full">
                        <InboxIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">No orders found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium">{order.customer}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(order.orderTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 font-medium">{formatCurrency(order.amountPaid)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(order.amountDue)}</TableCell>
                    <TableCell className="text-gray-600">{formatDate(order.dueDate)}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-right">
                      <Link href={`/orders/${order.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
