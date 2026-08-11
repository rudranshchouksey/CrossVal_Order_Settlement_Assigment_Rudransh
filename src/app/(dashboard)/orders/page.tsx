import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { listOrders } from '@/services/orders'
import { calculateAmountPaid, calculateAmountDue, calculateOrderStatus, OrderStatus } from '@/lib/calculations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    partially_paid: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    paid: 'bg-green-100 text-green-800 hover:bg-green-100',
    overdue: 'bg-red-100 text-red-800 hover:bg-red-100',
  }
  const labels = {
    pending: 'Pending',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue',
  }
  return <Badge className={styles[status]} variant="secondary">{labels[status]}</Badge>
}

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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <Link href="/orders/new" className={buttonVariants({ variant: 'default' })}>
          Create Order
        </Link>
      </div>

      <div className="flex gap-2">
        <Link href="/orders" className={`text-sm ${!statusFilter ? 'font-bold' : 'text-gray-500'}`}>All</Link>
        <Link href="/orders?status=pending" className={`text-sm ${statusFilter === 'pending' ? 'font-bold' : 'text-gray-500'}`}>Pending</Link>
        <Link href="/orders?status=partially_paid" className={`text-sm ${statusFilter === 'partially_paid' ? 'font-bold' : 'text-gray-500'}`}>Partially Paid</Link>
        <Link href="/orders?status=paid" className={`text-sm ${statusFilter === 'paid' ? 'font-bold' : 'text-gray-500'}`}>Paid</Link>
        <Link href="/orders?status=overdue" className={`text-sm ${statusFilter === 'overdue' ? 'font-bold' : 'text-gray-500'}`}>Overdue</Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Order Total</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Amount Due</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.customer}</TableCell>
                  <TableCell>{formatCurrency(order.orderTotal)}</TableCell>
                  <TableCell>{formatCurrency(order.amountPaid)}</TableCell>
                  <TableCell>{formatCurrency(order.amountDue)}</TableCell>
                  <TableCell>{formatDate(order.dueDate)}</TableCell>
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
  )
}
