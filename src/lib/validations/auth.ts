import { z } from 'zod'

export const loginSchema = z.object({
  mobile: z.string().min(5),
  password: z.string().min(6),
})

export const registerSchema = z.object({
  role: z.enum(['PROVIDER', 'CUSTOMER']),
  mobile: z.string().min(5),
  password: z.string().min(6),
  nameEN: z.string().optional(),
  nameAR: z.string().optional(),
  storeNameEN: z.string().optional(),
  storeNameAR: z.string().optional(),
})

export const verifyOTPSchema = z.object({
  userId: z.string().min(1),
  code: z.string().min(4).max(8),
})
