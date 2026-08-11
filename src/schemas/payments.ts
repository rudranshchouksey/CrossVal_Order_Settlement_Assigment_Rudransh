import { z } from 'zod'

export const PaymentSchema = z.object({
  amount: z.number().int().min(1, 'Payment amount must be at least 1 (in cents)'),
  paymentDate: z.string().datetime({ message: 'Invalid payment date' }),
  note: z.string().optional(),
})

export type CreatePaymentInput = z.infer<typeof PaymentSchema>
