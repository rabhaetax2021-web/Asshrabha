"use client"
import { useEffect, useState } from 'react'
import Button from './Button'

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferred(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler as any)
    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  const install = async () => {
    if (!deferred) return
    try {
      deferred.prompt()
      await deferred.userChoice
      setVisible(false)
    } catch (e) {
      console.error(e)
    }
  }

  if (!visible) return null
  return (
    <div className="pwa-install" role="dialog">
      <div className="pwa-install-inner">
        <div>Install Asshrabha for quicker access</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button className="btn-primary" onClick={install}>Install</Button>
          <Button onClick={() => setVisible(false)}>Dismiss</Button>
        </div>
      </div>
    </div>
  )
}
