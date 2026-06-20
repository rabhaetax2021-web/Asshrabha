import { z } from 'zod'

export const approveActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'set_visibility']),
  note: z.string().optional(),
  suspendNote: z.string().optional(),
  visible: z.boolean().optional(),
  adminUserId: z.string().optional(),
})
