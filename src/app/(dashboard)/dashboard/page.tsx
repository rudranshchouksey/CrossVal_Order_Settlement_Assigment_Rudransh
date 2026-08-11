import { requireAuth } from '@/lib/auth'
import { listOrders } from '@/services/orders'
import { calculateAmountPaid, calculateOrderStatus } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const user = await requireAuth()
  const orders = await listOrders(user.id)

  let totalOrders = orders.length
  let pendingCount = 0
  let partiallyPaidCount = 0
  let paidCount = 0
  let overdueCount = 0
  let totalOutstandingCents = 0

  orders.forEach(order => {
    const amountPaid = calculateAmountPaid(order.payments || [])
    const status = calculateOrderStatus(order.orderTotal, amountPaid, order.dueDate)

    if (status === 'pending') pendingCount++
    if (status === 'partially_paid') partiallyPaidCount++
    if (status === 'paid') paidCount++
    if (status === 'overdue') overdueCount++

    const due = order.orderTotal - amountPaid
    if (due > 0) {
      totalOutstandingCents += due
    }
  })

  const stats = [
    { title: 'Total Orders', value: totalOrders.toString() },
    { title: 'Pending', value: pendingCount.toString() },
    { title: 'Partially Paid', value: partiallyPaidCount.toString() },
    { title: 'Paid', value: paidCount.toString() },
    { title: 'Overdue', value: overdueCount.toString() },
    { title: 'Total Outstanding', value: formatCurrency(totalOutstandingCents) },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
