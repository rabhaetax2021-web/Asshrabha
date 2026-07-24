export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message

  // Handle GeolocationPositionError and similar plain objects that carry
  // a `message` or `code` property so we return a readable message instead
  // of the default '[object Object]' string.
  if (err && typeof err === 'object') {
    try {
      const anyErr = err as any
      if (typeof anyErr.message === 'string' && anyErr.message.length > 0) return anyErr.message
      // GeolocationPositionError.code values: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
      if (typeof anyErr.code === 'number') {
        switch (anyErr.code) {
          case 1:
            return 'Location permission denied'
          case 2:
            return 'Location information is unavailable'
          case 3:
            return 'Location request timed out'
          default:
            return `Location error (${anyErr.code})`
        }
      }
    } catch {
      // Fall through to string conversion
    }
  }

  try {
    return String(err)
  } catch {
    return 'Unknown error'
  }
}
