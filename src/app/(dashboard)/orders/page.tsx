import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { listOrders } from '@/services/orders'
import { calculateAmountPaid, calculateAmountDue, calculateOrderStatus, type OrderStatus } from '@/lib/calculations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Plus, ReceiptText } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusFilters: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Partially Paid', value: 'partially_paid' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
]

export default async function OrdersPage(props: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireAuth()
  const searchParams = await props.searchParams
  const statusFilter = searchParams.status

  const allOrders = await listOrders(user.id)

  const mappedOrders = allOrders.map((order, index) => {
    const amountPaid = calculateAmountPaid(order.payments || [])
    const amountDue = calculateAmountDue(order.orderTotal, amountPaid)
    const status = calculateOrderStatus(order.orderTotal, amountPaid, order.dueDate)
    // Generate a display-friendly order reference from the tail of the CUID
    const orderRef = `ORD-${order.id.slice(-4).toUpperCase()}`
    return { ...order, amountPaid, amountDue, status, orderRef }
  })

  const orders = statusFilter
    ? mappedOrders.filter(o => o.status === statusFilter)
    : mappedOrders

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders, payments, and outstanding balances."
        actions={
          <Link href="/orders/new" className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'gap-1.5')}>
            <Plus className="h-4 w-4" />
            Create Order
          </Link>
        }
      />

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        {statusFilters.map(({ label, value }) => {
          const isActive = value === statusFilter || (!value && !statusFilter)
          return (
            <Link
              key={label}
              href={value ? `/orders?status=${value}` : '/orders'}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Orders table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="h-5 w-5 text-muted-foreground" />}
            title={statusFilter ? 'No matching orders' : 'No orders yet'}
            description={
              statusFilter
                ? 'Try a different status filter.'
                : 'Create your first order to start tracking payments.'
            }
            action={
              !statusFilter ? (
                <Link href="/orders/new" className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}>
                  <Plus className="h-3.5 w-3.5" />
                  Create Order
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Order</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Total</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">Paid</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">Due</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="font-medium text-foreground hover:underline">
                        {order.customer}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell font-mono text-xs">{order.orderRef}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(order.orderTotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-success font-medium hidden sm:table-cell">{formatCurrency(order.amountPaid)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium hidden sm:table-cell">
                      <span className={order.amountDue > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                        {formatCurrency(order.amountDue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDate(order.dueDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-all"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
