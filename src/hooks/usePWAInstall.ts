'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'
import { isAndroidDevice, isIosDevice } from '@/utils/detectPlatform'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const PWA_INSTALL_ACCEPTED_KEY = 'pwa-install-accepted'

export function usePWAInstall() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstallPwa, setCanInstallPwa] = useState(false)
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
      deferredPromptRef.current = event as BeforeInstallPromptEvent
      setCanInstallPwa(true)
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

  const t = useTranslations('common')

  const shouldShowInstallButton = useMemo(
    () => !hideButton && ((isAndroid && canInstallPwa) || isIos),
    [hideButton, isAndroid, isIos, canInstallPwa]
  )

  const handleInstallClick = useCallback(async () => {
    if (isAndroid) {
      const promptEvent = deferredPromptRef.current
      if (!promptEvent) {
        showToast(
          t('installationUnavailable') || 'Installation unavailable.',
          'error'
        )
        return
      }

      try {
        await promptEvent.prompt()
        const choice = await promptEvent.userChoice

        if (choice.outcome === 'accepted') {
          showToast(
            t('installationSuccessful') || 'Application installed successfully.',
            'success'
          )
          setHideButton(true)
          localStorage.setItem(PWA_INSTALL_ACCEPTED_KEY, 'true')
        } else {
          showToast(
            t('installationCancelled') || 'Installation cancelled.',
            'info'
          )
        }
      } catch (error) {
        showToast(
          t('installationUnavailable') || 'Installation unavailable.',
          'error'
        )
      } finally {
        deferredPromptRef.current = null
        setCanInstallPwa(false)
      }

      return
    }

    if (isIos) {
      setShowIosModal(true)
      return
    }

    showToast(
      t('installationUnavailable') || 'Installation unavailable.',
      'error'
    )
  }, [isAndroid, isIos, t])

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
