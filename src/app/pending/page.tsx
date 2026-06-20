'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PendingPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="login-page">
      <div className="login-card glass" style={{ animation: 'scaleIn var(--transition-slow) ease-out', maxWidth: '440px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: 'var(--space-6)', animation: 'float 3s ease-in-out infinite' }}>
          ⏳
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-3)' }}>
          {t('pendingTitle')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
          {t('pendingSubtitle')}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          {t('pendingMessage')}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
          <button onClick={() => router.push('/login')} className="btn-secondary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
            {t('signIn')}
          </button>
        </div>
        <p style={{ marginTop: 'var(--space-6)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
          {t('checkStatus')}{dots}
        </p>
      </div>
    </div>
  );
}
