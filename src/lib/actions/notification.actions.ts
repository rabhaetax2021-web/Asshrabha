import { prisma } from '@/lib/prisma'

export async function createNotification(userId: string, type: string, titleEN: string, titleAR: string, data?: Record<string, unknown>) {
  return await prisma.notification.create({ data: { userId, type: type as any, titleEN, titleAR, data: data as any } })
}
