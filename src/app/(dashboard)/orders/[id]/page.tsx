import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getOrder } from '@/services/orders'
import { calculateAmountPaid, calculateAmountDue, calculateOrderStatus } from '@/lib/calculations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PaymentModal } from './PaymentModal'

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  const { id } = await props.params
  
  let order;
  try {
    order = await getOrder(user.id, id)
  } catch (err) {
    notFound()
  }

  // Calculate domain values on the server side (single source of truth)
  const amountPaid = calculateAmountPaid(order.payments || [])
  const amountDue = calculateAmountDue(order.orderTotal, amountPaid)
  const status = calculateOrderStatus(order.orderTotal, amountPaid, order.dueDate)
  
  const isPaid = status === 'paid'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order {order.id.slice(-8)}</h2>
          <p className="text-gray-500">Customer: {order.customer}</p>
        </div>
        <div className="flex gap-4 items-center">
          <Badge variant="outline" className="text-sm px-4 py-1">{status.toUpperCase()}</Badge>
          {!isPaid && <PaymentModal orderId={order.id} amountDue={amountDue} />}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Order Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(order.orderTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(amountPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(amountDue)}</div>
            <p className="text-xs text-gray-500 mt-1">Due: {formatDate(order.dueDate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!order.payments || order.payments.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                order.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.note || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
