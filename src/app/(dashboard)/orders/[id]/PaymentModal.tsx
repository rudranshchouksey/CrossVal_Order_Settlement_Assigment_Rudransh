'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PaymentSchema, CreatePaymentInput } from '@/schemas/payments'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { formatCurrency } from '@/lib/utils'

export function PaymentModal({ orderId, amountDue }: { orderId: string, amountDue: number }) {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: 'default' })}>
        Record Payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm">
          Remaining Balance: <span className="font-bold text-lg">{formatCurrency(amountDue)}</span>
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
                    <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
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
                    <Input type="datetime-local" {...field} onChange={e => {
                      const date = new Date(e.target.value)
                      field.onChange(date.toISOString())
                    }} value={field.value ? new Date(field.value).toISOString().slice(0,16) : ''} />
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
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Check #123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-sm text-red-500 font-medium">
                {error}
                {details && (
                  <div className="mt-1">
                    Requested: {formatCurrency(details.requested)} <br/>
                    Remaining: {formatCurrency(details.remaining)}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
