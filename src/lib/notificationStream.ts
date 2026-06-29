import EventEmitter from 'events'

type NotificationPayload = {
  id: string
  type: string
  titleEN: string
  titleAR: string
  bodyEN: string | null
  bodyAR: string | null
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

const emitters = new Map<string, EventEmitter>()

function getEmitter(userId: string) {
  let emitter = emitters.get(userId)
  if (!emitter) {
    emitter = new EventEmitter()
    emitters.set(userId, emitter)
  }
  return emitter
}

export function subscribeToNotifications(
  userId: string,
  callback: (payload: NotificationPayload) => void
) {
  const emitter = getEmitter(userId)
  emitter.on('notification', callback)
  return () => {
    emitter.off('notification', callback)
    if (emitter.listenerCount('notification') === 0) {
      emitter.removeAllListeners('notification')
      emitters.delete(userId)
    }
  }
}

export function publishNotification(userId: string, payload: NotificationPayload) {
  const emitter = emitters.get(userId)
  if (!emitter) return
  emitter.emit('notification', payload)
}

export function hasNotificationListeners(userId: string) {
  const emitter = emitters.get(userId)
  return emitter ? emitter.listenerCount('notification') > 0 : false
}
