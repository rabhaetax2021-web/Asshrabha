const VAPID_ENV_KEYS = [
  'NEXT_PUBLIC_WAPID_PUBLIC_KEY',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PUBLIC_KEY',
  'WAPID_PUBLIC_KEY',
  'next_public_wapid_public_key',
  'next_public_vapid_public_key',
  'vapid_public_key',
  'wapid_public_key',
]

export function getVapidPublicKey(env: NodeJS.ProcessEnv = process.env) {
  if (!env) return null

  for (const key of VAPID_ENV_KEYS) {
    const value = env[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  const lowerEnv = Object.entries(env).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      acc[key.toLowerCase()] = value.trim()
    }
    return acc
  }, {})

  for (const key of VAPID_ENV_KEYS.map((item) => item.toLowerCase())) {
    const value = lowerEnv[key]
    if (value) return value
  }

  return null
}
