import { z } from 'zod'

export const approveActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'set_visibility', 'set_location']),
  note: z.string().optional(),
  suspendNote: z.string().optional(),
  visible: z.boolean().optional(),
  adminUserId: z.string().optional(),
  wholesaleMinPrice: z.number().nonnegative().optional(),
  wholesaleMaxPrice: z.number().nonnegative().optional(),
  retailMinPrice: z.number().nonnegative().optional(),
  retailMaxPrice: z.number().nonnegative().optional(),
  categoryId: z.string().optional(),
  // location payload
  lat: z.number().optional(),
  lng: z.number().optional(),
  mapsLink: z.string().optional(),
  locationAddress: z.string().optional(),
})
