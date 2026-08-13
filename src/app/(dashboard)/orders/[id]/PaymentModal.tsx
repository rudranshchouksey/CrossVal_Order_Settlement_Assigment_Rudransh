'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PaymentSchema, CreatePaymentInput } from '@/schemas/payments'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { formatCurrency } from '@/lib/utils'
import { CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentModalProps {
  orderId: string
  amountDue: number
  orderTotal: number
  amountPaidSoFar: number
  variant?: 'default' | 'inline'
}

export function PaymentModal({ orderId, amountDue, orderTotal, amountPaidSoFar, variant = 'default' }: PaymentModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState<any>(null)

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      amount: amountDue,
      paymentDate: new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z',
      note: ''
    },
  })

  async function onSubmit(values: CreatePaymentInput) {
    setError('')
    setDetails(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error && data.error.details) {
          setDetails(data.error.details)
          throw new Error(data.error.message || 'Payment failed')
        }
        throw new Error(data.error || 'Payment failed')
      }
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const triggerButton = variant === 'inline' ? (
    <DialogTrigger className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}>
      <CreditCard className="h-3.5 w-3.5" />
      Record Payment
    </DialogTrigger>
  ) : (
    <DialogTrigger className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'gap-1.5')}>
      <CreditCard className="h-4 w-4" />
      Record Payment
    </DialogTrigger>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Record a payment against this order.</DialogDescription>
        </DialogHeader>

        {/* Financial context */}
        <div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/30 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Order Total</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatCurrency(orderTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Already Paid</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-success">{formatCurrency(amountPaidSoFar)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-destructive">{formatCurrency(amountDue)}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (cents)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max={amountDue} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Maximum payment: {formatCurrency(amountDue)}</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} onChange={e => {
                      const date = new Date(e.target.value)
                      field.onChange(date.toISOString())
                    }} value={field.value ? new Date(field.value).toISOString().slice(0,10) : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Wire transfer #123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                <p className="font-medium">{error}</p>
                {details && (
                  <div className="mt-1 text-xs">
                    <p>Requested: {formatCurrency(details.requested)}</p>
                    <p>Maximum allowed: {formatCurrency(details.remaining)}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving…
                  </>
                ) : 'Save Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
