import EventEmitter from 'events'

type MsgPayload = any

const emitters: Map<string, EventEmitter> = new Map()

export function getEmitter(roomId: string) {
  let e = emitters.get(roomId)
  if (!e) {
    e = new EventEmitter()
    emitters.set(roomId, e)
  }
  return e
}

export function publish(roomId: string, payload: MsgPayload) {
  const e = getEmitter(roomId)
  e.emit('message', payload)
}

export function subscribe(roomId: string, cb: (payload: MsgPayload) => void) {
  const e = getEmitter(roomId)
  e.on('message', cb)
  return () => { e.off('message', cb) }
}

export function removeEmitter(roomId: string) {
  const e = emitters.get(roomId)
  if (e) {
    e.removeAllListeners()
    emitters.delete(roomId)
  }
}

export default { publish, subscribe, getEmitter, removeEmitter }
