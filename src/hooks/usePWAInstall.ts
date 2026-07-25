'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { showToast } from '@/components/ui/toast'
import { isAndroidDevice, isIosDevice } from '@/utils/detectPlatform'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const PWA_INSTALL_ACCEPTED_KEY = 'pwa-install-accepted'

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosModal, setShowIosModal] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [hideButton, setHideButton] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const android = isAndroidDevice(userAgent)
    const ios = isIosDevice(userAgent)
    setIsAndroid(android)
    setIsIos(ios)

    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true

    const acceptedInstall = localStorage.getItem(PWA_INSTALL_ACCEPTED_KEY) === 'true'

    setIsInstalled(installed)
    setHideButton(installed || acceptedInstall)

    const displayModeMedia = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsInstalled(true)
        setHideButton(true)
        localStorage.setItem(PWA_INSTALL_ACCEPTED_KEY, 'true')
      }
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setHideButton(true)
      localStorage.setItem(PWA_INSTALL_ACCEPTED_KEY, 'true')
    }

    displayModeMedia.addEventListener?.('change', handleDisplayModeChange)
    displayModeMedia.addListener?.(handleDisplayModeChange)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      displayModeMedia.removeEventListener?.('change', handleDisplayModeChange)
      displayModeMedia.removeListener?.(handleDisplayModeChange)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    if (isInstalled) {
      setHideButton(true)
      localStorage.setItem(PWA_INSTALL_ACCEPTED_KEY, 'true')
    }
  }, [isInstalled])

  const isAndroidInstallReady = isAndroid && deferredPrompt !== null
  const shouldShowInstallButton = useMemo(
    () => !hideButton && (isAndroidInstallReady || isIos),
    [hideButton, isAndroidInstallReady, isIos]
  )

  const handleInstallClick = useCallback(async () => {
    if (isAndroid) {
      if (!deferredPrompt) {
        showToast('Installation unavailable.', 'error')
        return
      }

      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice

        if (choice.outcome === 'accepted') {
          showToast('Application installed successfully.', 'success')
          setHideButton(true)
          localStorage.setItem(PWA_INSTALL_ACCEPTED_KEY, 'true')
          setDeferredPrompt(null)
        } else {
          showToast('Installation cancelled.', 'info')
        }
      } catch (error) {
        showToast('Installation unavailable.', 'error')
      }

      return
    }

    if (isIos) {
      setShowIosModal(true)
      return
    }

    showToast('Installation unavailable.', 'error')
  }, [deferredPrompt, isAndroid, isIos])

  const closeIosModal = useCallback(() => {
    setShowIosModal(false)
  }, [])

  return {
    shouldShowInstallButton,
    showIosModal,
    handleInstallClick,
    closeIosModal,
  }
}
