import { z } from 'zod'

export const withdrawRequestSchema = z.object({
  walletId: z.string().min(1),
  amount: z.number().positive(),
})
