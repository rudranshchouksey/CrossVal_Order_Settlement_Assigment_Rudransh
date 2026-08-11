import { requireAuth } from '@/lib/auth'
import { listOrders } from '@/services/orders'
import { calculateAmountPaid, calculateOrderStatus } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, Clock, FileText, AlertCircle, TrendingDown, DollarSign } from 'lucide-react'

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
    { title: 'Total Orders', value: totalOrders.toString(), icon: FileText },
    { title: 'Pending', value: pendingCount.toString(), icon: Clock },
    { title: 'Partially Paid', value: partiallyPaidCount.toString(), icon: TrendingDown },
    { title: 'Paid', value: paidCount.toString(), icon: CheckCircle2 },
    { title: 'Overdue', value: overdueCount.toString(), icon: AlertCircle },
    { title: 'Total Outstanding', value: formatCurrency(totalOutstandingCents), icon: DollarSign },
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h2>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
