import { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { publishNotification } from '@/lib/notificationStream'

async function sendPushNotifications(
  subscription: any,
  payload: { title: string; body?: string; data?: Record<string, unknown> }
) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webPush = await import('web-push')
    webPush.setVapidDetails(
      `mailto:${process.env.VAPID_CONTACT_EMAIL || 'support@asshrabha.com'}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
    await webPush.sendNotification(subscription, JSON.stringify(payload))
  } catch (error) {
    console.error('[notification] push send failed', error)
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  titleEN: string,
  titleAR: string,
  data?: Record<string, unknown>
) {
  const notification = await prisma.notification.create({
    data: { userId, type, titleEN, titleAR, bodyEN: data?.bodyEN as string | null, bodyAR: data?.bodyAR as string | null, data: data as any },
  })

  publishNotification(userId, {
    ...notification,
    data: notification.data as Record<string, unknown> | null,
    createdAt: notification.createdAt.toISOString(),
  })

  try {
    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { pushSubscriptions: true },
    })
    const subscriptions = Array.isArray(user?.pushSubscriptions) ? user.pushSubscriptions : []
    const payload = {
      title: titleEN || titleAR || 'Asshrabha',
      body: (data?.bodyEN as string) || (data?.bodyAR as string) || undefined,
      data,
    }

    await Promise.all(
      subscriptions.map((subscription: unknown) =>
        sendPushNotifications(subscription, payload as any)
      )
    )
  } catch (error) {
    console.error('[notification] failed to send push notifications', error)
  }

  return notification
}
