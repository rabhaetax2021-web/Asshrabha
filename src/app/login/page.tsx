'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { loginAction } from '@/lib/actions/auth.actions';
import Link from 'next/link';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If mobile/password were supplied in the URL (e.g. from an external link),
  // prefill the form and remove sensitive query params from the address bar.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mobile');
      const p = params.get('password');
      let changed = false;
      if (m) {
        setMobile(m);
        changed = true;
      }
      if (p) {
        setPassword(p);
        changed = true;
      }

      const saved = window.localStorage.getItem('asshrabha-remembered-login');
      if (saved) {
        const parsed = JSON.parse(saved) as { mobile?: string; password?: string; rememberMe?: boolean };
        if (parsed.mobile) setMobile(parsed.mobile);
        if (parsed.password) setPassword(parsed.password);
        setRememberMe(Boolean(parsed.rememberMe));
      }

      if (changed) {
        // Remove query string without creating a new history entry
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginAction(mobile, password);

      if (result.success && result.data) {
        if (rememberMe) {
          window.localStorage.setItem('asshrabha-remembered-login', JSON.stringify({ mobile, password, rememberMe: true }));
        } else {
          window.localStorage.removeItem('asshrabha-remembered-login');
        }
        router.push(result.data.redirectTo);
      } else {
        switch (result.error) {
          case 'ACCOUNT_DISABLED':
            setError(t('accountDisabled'));
            break;
          case 'ACCOUNT_SUSPENDED':
            setError(t('accountSuspended'));
            break;
          case 'INVALID_CREDENTIALS':
          default:
            setError(t('loginError'));
        }
      }
    } catch {
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  const switchLocale = () => {
    const currentLocale = document.documentElement.lang;
    const newLocale = currentLocale === 'ar' ? 'en' : 'ar';
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="login-page">
      <div
        style={{
          position: 'fixed',
          top: 'var(--space-4)',
          insetInlineEnd: 'var(--space-4)',
          zIndex: 100,
          display: 'flex',
          gap: 'var(--space-2)',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => toggle()}
          className="btn-ghost"
          aria-label="Toggle theme"
          style={{
            color: 'white',
            fontSize: 'var(--text-sm)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
          }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        <button
          type="button"
          onClick={switchLocale}
          className="btn-ghost"
          style={{
            color: 'white',
            fontSize: 'var(--text-sm)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
          }}
        >
          {tc('language') === 'Language' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="login-card glass" style={{ animation: 'scaleIn var(--transition-slow) ease-out' }}>
        {/* Logo / App Name */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'white',
              boxShadow: 'var(--shadow-primary-lg)',
            }}
          >
            أ
          </div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 'var(--space-2)',
            }}
          >
            {t('loginTitle')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'hsla(0, 84%, 60%, 0.1)',
              border: '1px solid hsla(0, 84%, 60%, 0.3)',
              color: 'var(--error)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              animation: 'shake 0.5s ease-in-out',
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label" htmlFor="mobile">
              {t('mobileNumber')}
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              className="input"
              placeholder={t('mobilePlaceholder')}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
              autoComplete="tel"
              dir="ltr"
              style={{ textAlign: 'start' }}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label" htmlFor="password">
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingInlineEnd: 'var(--space-12)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  insetInlineEnd: 'var(--space-3)',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 'var(--space-1)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t('rememberMe')}</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              fontSize: 'var(--text-base)',
              position: 'relative',
            }}
          >
            {loading ? (
              <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            ) : (
              t('signIn')
            )}
          </button>
        </form>

        {/* Register Link */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-6)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          {t('noAccount')}{' '}
          <Link
            href="/register"
            style={{
              color: 'var(--primary)',
              fontWeight: 'var(--font-semibold)',
              textDecoration: 'none',
            }}
          >
            {t('signUp')}
          </Link>
        </div>
      </div>
    </div>
  );
}
