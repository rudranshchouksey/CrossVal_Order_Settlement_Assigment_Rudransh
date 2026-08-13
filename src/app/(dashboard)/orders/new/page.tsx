'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateOrderSchema, CreateOrderInput } from '@/schemas/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function NewOrderPage() {
  const router = useRouter()

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      customer: '',
      dueDate: new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z',
      items: [{ description: '', quantity: 1, unitPrice: 0 }]
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  })

  const watchItems = form.watch("items")
  const liveTotal = watchItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0)

  async function onSubmit(values: CreateOrderInput) {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order')
      }
      toast.success('Order created successfully')
      router.push(`/orders/${data.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/orders" className="hover:text-foreground transition-colors">Orders</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Create Order</span>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-foreground">Create Order</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Main form */}
            <div className="space-y-6">
              {/* Order details */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <h2 className="text-sm font-medium text-foreground">Order Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
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
                </div>
              </div>

              {/* Line items */}
              <div className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-foreground">Line Items</h2>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </Button>
                </div>

                {/* Header row */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_80px_120px_32px] gap-3 text-xs font-medium text-muted-foreground px-0.5">
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit Price (¢)</span>
                  <span></span>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_32px] gap-3 items-start">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sm:sr-only">Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Service or product" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sm:sr-only">Qty</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sm:sr-only">Unit Price</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-center pt-0 sm:pt-0.5">
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary sidebar */}
            <div className="lg:sticky lg:top-6 h-fit">
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h2 className="text-sm font-medium text-foreground">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{watchItems.length} item{watchItems.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-foreground">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(liveTotal)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Server-side calculation is authoritative.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating…
                </>
              ) : 'Create Order'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
