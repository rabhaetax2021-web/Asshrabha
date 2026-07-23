'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Platform = 'android' | 'iphone' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPage() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      if (standalone) {
        router.push('/login');
      }
    };

    setIsIos(/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()));
    setIsAndroid(/android/.test(navigator.userAgent.toLowerCase()));

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        router.push('/login');
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    const handleBeforeInstallPrompt = (e: Event) => {
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      router.push('/login');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [router]);

  const handleInstallAndroid = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      router.push('/login');
    }
  }, [deferredPrompt, router]);

  const androidSteps = [
    { text: 'افتح الموقع في متصفح Chrome', en: 'Open this site in Chrome browser' },
    { text: 'اضغط على قائمة المتصفح (النقاط الثلاث)', en: 'Tap the browser menu (three dots)' },
    { text: 'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"', en: 'Choose "Install app" or "Add to Home screen"' },
    { text: 'اضغط "تثبيت"', en: 'Tap "Install"' },
  ];

  const iphoneSteps = [
    { text: 'افتح الموقع في Safari', en: 'Open this site in Safari' },
    { text: 'اضغط على زر المشاركة (السهم المربع)', en: 'Tap the Share button (square with arrow)' },
    { text: 'مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية"', en: 'Scroll down and tap "Add to Home Screen"' },
    { text: 'اضغط "إضافة" في الأعلى', en: 'Tap "Add" at the top' },
  ];

  const platformButtons = [
    {
      key: 'android' as const,
      label: 'Android',
      icon: (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
          <path d="M17.523 15.3414c-.5668 0-1.0278-.461-1.0278-1.0278 0-.5668.461-1.0278 1.0278-1.0278.5668 0 1.0278.461 1.0278 1.0278 0 .5668-.461 1.0278-1.0278 1.0278zm-11.046 0c-.5668 0-1.0278-.461-1.0278-1.0278 0-.5668.461-1.0278 1.0278-1.0278.5668 0 1.0278.461 1.0278 1.0278 0 .5668-.461 1.0278-1.0278 1.0278zm11.4-5.7526l1.9956-3.4544c.1116-.1932.0454-.4404-.1478-.552-.1932-.1116-.4404-.0454-.552.1478l-2.0202 3.497C15.7802 9.037 13.947 8.5 12 8.5c-1.947 0-3.7802.537-5.3528 1.4832L4.627 6.4862c-.1116-.1932-.3588-.2594-.552-.1478-.1932.1116-.2594.3588-.1478.552l1.9956 3.4544C2.49 11.6626.5 14.6684.5 18.0962h23c0-3.4278-1.99-6.4336-4.9732-8.5074z" />
        </svg>
      ),
    },
    {
      key: 'iphone' as const,
      label: 'iPhone',
      icon: (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-2.96 1.74-2.45 5.98.22 7.13-.57 1.5-1.31 2.99-2.27 4.08zm-5.85-15.1c.07-1.76 1.55-3.35 3.29-3.41.29 1.94-1.63 3.79-3.29 3.41z" />
        </svg>
      ),
    },
  ];

  const steps = selectedPlatform === 'android' ? androidSteps : iphoneSteps;

  if (isStandalone) {
    return null;
  }

  return (
    <main className="pwa-page" dir={isIos || isAndroid ? 'rtl' : undefined}>
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
            <h1>Welcome to Ashrabha</h1>
            <p>Choose your phone type to install the app</p>
            <p>اختر نوع هاتفك لتثبيت التطبيق</p>
          </div>
        </header>

        {!selectedPlatform && (
          <div className="pwa-platform-grid">
            {platformButtons.map((btn) => (
              <button
                key={btn.key}
                type="button"
                className={`pwa-platform-card${selectedPlatform === btn.key ? ' active' : ''}`}
                onClick={() => setSelectedPlatform(btn.key)}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        )}

        {selectedPlatform && (
          <section className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              <button
                type="button"
                onClick={() => setSelectedPlatform(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: 0,
                }}
              >
                ←
              </button>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                {selectedPlatform === 'android' ? 'Android' : 'iPhone'} Installation
              </h2>
            </div>

            {selectedPlatform === 'android' && deferredPrompt && (
              <button type="button" className="btn btn-primary pwa-install-button" onClick={handleInstallAndroid}>
                تثبيت التطبيق الآن / Install App Now
              </button>
            )}

            <ol className="pwa-steps">
              {steps.map((step, index) => (
                <li key={index} style={{ animationDelay: `${index * 0.08}s` }}>
                  <span>{index + 1}</span>
                  <div>
                    <p>{step.text}</p>
                    <p>{step.en}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
