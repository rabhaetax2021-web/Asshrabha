'use client'

import { useTranslations } from 'next-intl'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface InstallModalProps {
  open: boolean
  onClose: () => void
}

export default function InstallModal({ open, onClose }: InstallModalProps) {
  const t = useTranslations('common')

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <h2 className="install-modal-title">{t('installAppModalTitle') || 'Install App on your iPhone'}</h2>
          <p className="install-modal-description">
            {t('installAppModalDescription') || 'Use the browser Share menu to add Asshrabha to your Home Screen.'}
          </p>
        </div>

        <ol className="install-modal-steps">
          <li>
            <span>1</span>
            <div>
              <p>{t('installAppStepShare') || 'Tap the Share button.'}</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <p>{t('installAppStepAddToHome') || 'Tap Add to Home Screen.'}</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <p>{t('installAppStepConfirm') || 'Tap Add.'}</p>
            </div>
          </li>
        </ol>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={onClose}>
            {t('cancel') || 'Close'}
          </Button>
          <Button onClick={onClose}>{t('ok') || 'OK'}</Button>
        </div>
      </div>
    </Modal>
  )
}
