import { requireAuth } from '@/lib/auth'
import { listOrders } from '@/services/orders'
import { calculateAmountPaid, calculateAmountDue, calculateOrderStatus, type OrderStatus } from '@/lib/calculations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { KpiCard } from '@/components/KpiCard'
import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/ui/status-badge'
import { FileText, Clock, CreditCard, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireAuth()
  const orders = await listOrders(user.id)

  let pendingCount = 0
  let partiallyPaidCount = 0
  let paidCount = 0
  let overdueCount = 0
  let totalOutstandingCents = 0
  let totalValueCents = 0

  type MappedOrder = (typeof orders)[number] & {
    amountPaid: number
    amountDue: number
    status: OrderStatus
  }

  const mappedOrders: MappedOrder[] = orders.map(order => {
    const amountPaid = calculateAmountPaid(order.payments || [])
    const amountDue = calculateAmountDue(order.orderTotal, amountPaid)
    const status = calculateOrderStatus(order.orderTotal, amountPaid, order.dueDate)

    totalValueCents += order.orderTotal
    if (status === 'pending') pendingCount++
    if (status === 'partially_paid') partiallyPaidCount++
    if (status === 'paid') paidCount++
    if (status === 'overdue') overdueCount++
    if (amountDue > 0) totalOutstandingCents += amountDue

    return { ...order, amountPaid, amountDue, status }
  })

  const recentOrders = mappedOrders.slice(0, 5)

  const outstandingOrders = mappedOrders
    .filter(o => o.status === 'overdue' || o.status === 'partially_paid')
    .sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1
      if (a.status !== 'overdue' && b.status === 'overdue') return 1
      return b.amountDue - a.amountDue
    })
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Financial Operations"
        subtitle="Track orders, payments, outstanding balances, and collection status."
      />

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total Orders"
          value={orders.length.toString()}
          description="Across all customers"
          icon={<FileText className="h-4 w-4" />}
        />
        <KpiCard
          label="Pending"
          value={pendingCount.toString()}
          description="Awaiting payment"
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          label="Partially Paid"
          value={partiallyPaidCount.toString()}
          description="In progress"
          icon={<CreditCard className="h-4 w-4" />}
          accent="info"
        />
        <KpiCard
          label="Paid"
          value={paidCount.toString()}
          description="Fully settled"
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="success"
        />
        <KpiCard
          label="Overdue"
          value={overdueCount.toString()}
          description={overdueCount > 0 ? 'Requires attention' : 'None outstanding'}
          icon={<AlertCircle className="h-4 w-4" />}
          accent={overdueCount > 0 ? 'destructive' : 'default'}
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(totalOutstandingCents)}
          description="Amount remaining to collect"
          icon={<DollarSign className="h-4 w-4" />}
          accent={totalOutstandingCents > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Recent Orders */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Recent Orders</h2>
          <Link href="/orders" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-lg border bg-card">
            <EmptyState
              title="No orders yet"
              description="Create your first order to start tracking payments."
              action={
                <Link href="/orders/new" className="text-sm font-medium text-foreground hover:underline">
                  + Create Order
                </Link>
              }
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Total</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">Paid</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link href={`/orders/${order.id}`} className="font-medium text-foreground hover:underline">
                          {order.customer}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatCurrency(order.orderTotal)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-success font-medium hidden sm:table-cell">{formatCurrency(order.amountPaid)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{formatDate(order.dueDate)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Outstanding Payments */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">Outstanding Payments</h2>
        {outstandingOrders.length === 0 ? (
          <div className="rounded-lg border bg-card">
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5 text-success" />}
              title="All caught up"
              description="No overdue or partially paid orders at this time."
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Order Total</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Outstanding</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingOrders.map(order => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link href={`/orders/${order.id}`} className="font-medium text-foreground hover:underline">
                          {order.customer}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatCurrency(order.orderTotal)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-destructive">{formatCurrency(order.amountDue)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{formatDate(order.dueDate)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
