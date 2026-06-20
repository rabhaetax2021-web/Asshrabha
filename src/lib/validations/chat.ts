import { z } from 'zod'

export const sendMessageSchema = z.object({
  chatRoomId: z.string().min(1),
  senderId: z.string().min(1),
  content: z.string().min(1),
})
