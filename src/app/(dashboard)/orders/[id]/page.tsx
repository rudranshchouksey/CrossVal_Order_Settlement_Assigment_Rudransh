import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getOrder } from '@/services/orders'
import { calculateAmountPaid, calculateAmountDue, calculateOrderStatus } from '@/lib/calculations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { PaymentModal } from './PaymentModal'
import { InboxIcon, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

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
      <div className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors w-fit">
        <ChevronLeft className="w-4 h-4 mr-1" />
        <Link href="/orders">Back to Orders</Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Order {order.id.slice(-8)}</h2>
            <StatusBadge status={status} />
          </div>
          <p className="text-gray-500 font-medium">{order.customer}</p>
        </div>
        <div className="flex gap-4 items-center">
          {!isPaid && <PaymentModal orderId={order.id} amountDue={amountDue} />}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Order Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-gray-900">{formatCurrency(order.orderTotal)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-emerald-600">{formatCurrency(amountPaid)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Amount Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-rose-600">{formatCurrency(amountDue)}</div>
            <p className="text-xs text-gray-400 mt-1">Due: {formatDate(order.dueDate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-gray-900">Description</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Quantity</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Unit Price</TableHead>
                  <TableHead className="text-right font-semibold text-gray-900">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-gray-900">{item.description}</TableCell>
                    <TableCell className="text-right text-gray-600">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums text-gray-600">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-gray-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-gray-900">Date</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-900">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!order.payments || order.payments.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 space-y-3">
                        <div className="bg-gray-100 p-3 rounded-full">
                          <InboxIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">No payments recorded yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  order.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-gray-600">{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-emerald-600">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="text-gray-600">{payment.note || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
