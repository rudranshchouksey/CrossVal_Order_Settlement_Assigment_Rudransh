import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getOrder } from '@/services/orders'
import { calculateAmountPaid, calculateAmountDue, calculateOrderStatus } from '@/lib/calculations'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/EmptyState'
import { PaymentModal } from './PaymentModal'
import { DeleteOrderButton } from './DeleteOrderButton'
import { CreditCard, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
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

  const amountPaid = calculateAmountPaid(order.payments || [])
  const amountDue = calculateAmountDue(order.orderTotal, amountPaid)
  const status = calculateOrderStatus(order.orderTotal, amountPaid, order.dueDate)
  const isPaid = status === 'paid'
  const isOverdue = status === 'overdue'
  const orderRef = `ORD-${order.id.slice(-4).toUpperCase()}`

  // Calculate overdue days
  let overdueDays = 0
  if (isOverdue) {
    overdueDays = Math.floor((Date.now() - new Date(order.dueDate).getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/orders" className="hover:text-foreground transition-colors">Orders</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{order.customer}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {order.customer}
            </h1>
            <StatusBadge status={status} />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{orderRef}</span>
            <span>·</span>
            <span>Due {formatDate(order.dueDate)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPaid && <PaymentModal orderId={order.id} amountDue={amountDue} orderTotal={order.orderTotal} amountPaidSoFar={amountPaid} />}
          <Link href={`/orders/${order.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'default' })}>
            Edit
          </Link>
          {(!order.payments || order.payments.length === 0) && (
            <DeleteOrderButton orderId={order.id} />
          )}
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Order Total</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(order.orderTotal)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{order.items?.length || 0} line item{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Amount Paid</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-success">{formatCurrency(amountPaid)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{order.payments?.length || 0} payment{(order.payments?.length || 0) !== 1 ? 's' : ''} recorded</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Amount Due</p>
          <p className={cn('mt-1.5 text-2xl font-semibold tabular-nums', amountDue > 0 ? 'text-destructive' : 'text-success')}>
            {formatCurrency(amountDue)}
          </p>
          {isPaid && (
            <p className="mt-1 flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3 w-3" /> Paid in full
            </p>
          )}
          {isOverdue && (
            <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> Payment overdue by {overdueDays} day{overdueDays !== 1 ? 's' : ''}
            </p>
          )}
          {status === 'partially_paid' && (
            <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(amountDue)} remaining</p>
          )}
          {status === 'pending' && (
            <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(order.dueDate)}</p>
          )}
        </div>
      </div>

      {/* Line Items */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">Order Items</h2>
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Unit Price</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{item.description}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">{formatCurrency(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/20">
                  <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Order Total</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-foreground">{formatCurrency(order.orderTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* Payment History */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Payment History</h2>
          {order.payments && order.payments.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Paid: <span className="font-medium tabular-nums text-success">{formatCurrency(amountPaid)}</span></span>
              <span>Remaining: <span className="font-medium tabular-nums">{formatCurrency(amountDue)}</span></span>
            </div>
          )}
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          {(!order.payments || order.payments.length === 0) ? (
            <EmptyState
              icon={<CreditCard className="h-5 w-5 text-muted-foreground" />}
              title="No payments recorded"
              description="Record the first payment to begin tracking this order."
              action={
                !isPaid ? <PaymentModal orderId={order.id} amountDue={amountDue} orderTotal={order.orderTotal} amountPaidSoFar={amountPaid} variant="inline" /> : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(payment.paymentDate)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-success">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{payment.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/20">
                    <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Total Paid</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-success">{formatCurrency(amountPaid)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
