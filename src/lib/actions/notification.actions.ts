import { prisma } from '@/lib/prisma'

export async function createNotification(userId: string, type: any, titleEN: string, titleAR: string, data?: any) {
  return await prisma.notification.create({ data: { userId, type, titleEN, titleAR, data } })
}
