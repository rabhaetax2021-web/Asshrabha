import { z } from 'zod'

export const cartItemSchema = z.object({
  providerProductId: z.string().min(1),
  quantity: z.number().int().positive(),
})

export const checkoutSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(cartItemSchema).min(1),
  addressId: z.string().optional(),
})
