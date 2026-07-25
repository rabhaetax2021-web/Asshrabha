'use client'

import { ArrowDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import InstallModal from '@/components/InstallModal'

export default function InstallButton() {
  const t = useTranslations('common')
  const { shouldShowInstallButton, showIosModal, handleInstallClick, closeIosModal } = usePWAInstall()

  if (!shouldShowInstallButton) return null

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className="install-fab"
        onClick={handleInstallClick}
        aria-label={t('installApp') || 'Install App'}
      >
        <ArrowDown className="install-fab-icon" size={18} />
        {t('installApp') || 'Install App'}
      </Button>
      <InstallModal open={showIosModal} onClose={closeIosModal} />
    </>
  )
}
