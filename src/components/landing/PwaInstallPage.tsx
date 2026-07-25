'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import InstallButton from '@/components/InstallButton';

export default function PwaInstallPage() {
  const t = useTranslations('shop');
  const router = useRouter();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      if (standalone) {
        router.replace('/login');
      }
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        router.replace('/login');
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [router]);

  if (isStandalone) {
    return (
      <main className="pwa-page">
        <div className="pwa-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'grid',
              placeItems: 'center',
              color: 'white',
              fontSize: '1.75rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-primary-lg)',
              margin: '0 auto var(--space-4)',
            }}
          >
            ✓
          </div>
          <h1 style={{ marginBottom: 'var(--space-2)' }}>{t('pwaTitle') || 'Install App'}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('redirectingToApp') || 'Opening app...'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pwa-page">
      <div className="pwa-card">
        <header className="pwa-card-header">
          <div style={{ display: 'grid', gap: '0.5rem', alignItems: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                fontSize: '1.75rem',
                fontWeight: 700,
                boxShadow: 'var(--shadow-primary-lg)',
              }}
            >
              أ
            </div>
          </div>
          <div>
            <h1>{t('pwaTitle') || 'Welcome to Ashrabha'}</h1>
            <p>{t('pwaSubtitle') || 'Install the app for a better mobile experience.'}</p>
            <p>{t('pwaSubtitleAr') || 'قم بتثبيت التطبيق للحصول على تجربة موبايل أفضل.'}</p>
          </div>
        </header>

        <div className="pwa-install-page-hero" style={{ marginTop: 'var(--space-5)' }}>
          <InstallButton />
        </div>
      </div>
    </main>
  );
}
