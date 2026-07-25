'use client'

export function isAndroidDevice(userAgent: string): boolean {
  return /android/.test(userAgent.toLowerCase())
}

export function isIosDevice(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase()
  const isiOSDevice = /iphone|ipad|ipod/.test(lowerUA)
  const isMacTouch = typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isiOSDevice || isMacTouch
}

export function isIosSafari(userAgent: string): boolean {
  const isSafari = /safari/i.test(userAgent) && !/crios|fxios|opios|edgios/i.test(userAgent)
  return isIosDevice(userAgent) && isSafari
}
