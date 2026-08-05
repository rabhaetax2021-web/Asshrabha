export function getVapidPublicKey(env: NodeJS.ProcessEnv = process.env) {
  return (
    env.NEXT_PUBLIC_WAPID_PUBLIC_KEY ||
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    env.VAPID_PUBLIC_KEY ||
    null
  )
}
