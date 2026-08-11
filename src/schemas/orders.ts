import { z } from 'zod'

export const OrderItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().int().min(0, 'Unit price must be at least 0 (in cents)'),
})

export const CreateOrderSchema = z.object({
  customer: z.string().min(1, 'Customer name is required'),
  dueDate: z.string().datetime({ message: 'Invalid due date' }),
  items: z.array(OrderItemSchema).min(1, 'At least one order item is required'),
})

export const UpdateOrderSchema = CreateOrderSchema

export type OrderItemInput = z.infer<typeof OrderItemSchema>
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>
