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
  locationId: z.string().optional(),
  locationAddress: z.string().optional(),
})

// For CUSTOMER role, require both locationId (governorate) and locationAddress (street)
export const registerSchemaWithLocation = registerSchema.refine((data) => {
  if (data.role !== 'CUSTOMER') return true
  return Boolean(data.locationId && data.locationAddress && String(data.locationAddress).trim())
}, { message: 'MISSING_LOCATION', path: ['locationId'] })

export const verifyOTPSchema = z.object({
  userId: z.string().min(1),
  code: z.string().min(4).max(8),
})
