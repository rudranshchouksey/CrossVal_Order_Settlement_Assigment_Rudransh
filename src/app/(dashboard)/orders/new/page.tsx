'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateOrderSchema, CreateOrderInput } from '@/schemas/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { formatCurrency } from '@/lib/utils'

export default function NewOrderPage() {
  const router = useRouter()
  const [error, setError] = useState('')

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

  // Live UX Preview Calculation
  const watchItems = form.watch("items")
  const liveTotal = watchItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0)

  async function onSubmit(values: CreateOrderInput) {
    setError('')
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

      router.push(`/orders/${data.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors w-fit -mb-2">
        <span className="mr-1">←</span>
        <span className="cursor-pointer" onClick={() => router.back()}>Back</span>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create Order</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <Input type="datetime-local" {...field} onChange={e => {
                        const date = new Date(e.target.value)
                        field.onChange(date.toISOString())
                      }} value={field.value ? new Date(field.value).toISOString().slice(0,16) : ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Description</FormLabel>
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
                      <FormItem className="w-24">
                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Qty</FormLabel>
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
                      <FormItem className="w-32">
                        <FormLabel className={index !== 0 ? "sr-only" : ""}>Unit Price (cents)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className={`pt-${index === 0 ? '8' : '2'} w-12 text-right`}>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                        x
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t flex justify-end">
                <div className="text-lg font-bold">
                  Order Total (Preview): {formatCurrency(liveTotal)}
                </div>
              </div>
            </CardContent>
          </Card>

          {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : 'Create Order'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
