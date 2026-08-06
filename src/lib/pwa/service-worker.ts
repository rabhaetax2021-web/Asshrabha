export function shouldRegisterServiceWorker(hostname: string, env = process.env.NODE_ENV) {
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  return env === 'production' ? isLocalHost : true
}
