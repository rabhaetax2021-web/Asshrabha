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
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    } catch (e) { return false }
  });
  const [isIos, setIsIos] = useState<boolean>(() => typeof window !== 'undefined' && /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()));
  const [isAndroid, setIsAndroid] = useState<boolean>(() => typeof window !== 'undefined' && /android/.test(navigator.userAgent.toLowerCase()));

  // Detect if already installed as PWA and platform
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

    checkStandalone();

    // Listen for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        router.push('/login');
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    // Capture Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
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
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        router.push('/login');
      }
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
    return null; // Will redirect
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'white',
              boxShadow: 'var(--shadow-primary-lg)',
              animation: 'scaleIn var(--transition-slow) ease-out',
            }}
          >
            أ
          </div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'white',
              marginBottom: 'var(--space-2)',
              animation: 'fadeInUp var(--transition-slow) ease-out 0.1s both',
            }}
          >
            Welcome to Ashrabha
          </h1>
          <p
            dir="rtl"
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-semibold)',
              color: 'white',
              marginBottom: 'var(--space-2)',
              textAlign: 'center',
              animation: 'fadeInUp var(--transition-slow) ease-out 0.2s both',
            }}
          >
            مرحبا بك في أشربها
          </p>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              animation: 'fadeInUp var(--transition-slow) ease-out 0.3s both',
            }}
          >
            Choose your phone type to install the app
          </p>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              animation: 'fadeInUp var(--transition-slow) ease-out 0.3s both',
            }}
          >
            اختر نوع هاتفك لتثبيت التطبيق
          </p>
        </div>

        {/* Platform Selection */}
        {!selectedPlatform && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-4)',
              animation: 'fadeInUp var(--transition-slow) ease-out 0.4s both',
            }}
          >
            {platformButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setSelectedPlatform(btn.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-6) var(--space-4)',
                  borderRadius: 'var(--radius-xl)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast) ease',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Install Instructions */}
        {selectedPlatform && (
          <div
            className="glass"
            style={{
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              animation: 'fadeInUp var(--transition-normal) ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <button
                onClick={() => setSelectedPlatform(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-lg)',
                  padding: 'var(--space-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ←
              </button>
              <h2
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-bold)',
                  color: 'white',
                }}
              >
                {selectedPlatform === 'android' ? 'Android' : 'iPhone'} Installation
              </h2>
            </div>

            {/* Native install button for Android */}
            {selectedPlatform === 'android' && deferredPrompt && (
              <button
                onClick={handleInstallAndroid}
                style={{
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 'var(--space-6)',
                  boxShadow: 'var(--shadow-primary)',
                  transition: 'transform var(--transition-fast) ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                تثبيت التطبيق الآن / Install App Now
              </button>
            )}

            <ol
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                padding: 0,
                margin: 0,
                listStyle: 'none',
              }}
            >
              {steps.map((step, index) => (
                <li
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                    animation: `fadeInUp var(--transition-normal) ease-out ${index * 0.1}s both`,
                  }}
                >
                  <span
                    style={{
                      minWidth: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-bold)',
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p style={{ color: 'white', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
                      {step.text}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                      {step.en}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* In-card login hint removed: login only from PWA */}
          </div>
        )}

        {/* Bottom fallback removed: login only available from PWA */}
      </div>
    </div>
  );
}
