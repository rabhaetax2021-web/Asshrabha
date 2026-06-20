'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { forceResetPasswordAction } from '@/lib/actions/auth.actions';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { data: session } = useSession();
  const search = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError(t('passwordRequirements')); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      let userId = (session?.user as any)?.id;
      if (!userId) {
        userId = search?.get('userId') || undefined;
      }
      if (!userId) { setError('Session expired'); return; }
      const result = await forceResetPasswordAction(userId, newPassword);
      if (result.success) {
        router.push('/login');
      } else {
        setError(result.error || 'Failed');
      }
    } catch { setError('An error occurred'); } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card glass" style={{ animation: 'scaleIn var(--transition-slow) ease-out', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🔑</div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>{t('resetPasswordTitle')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{t('resetPasswordSubtitle')}</p>
        </div>
        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'hsla(0,84%,60%,0.1)', border: '1px solid hsla(0,84%,60%,0.3)', color: 'var(--error)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', animation: 'shake 0.5s ease-in-out' }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label" htmlFor="new-pw">{t('newPassword')}</label>
            <input id="new-pw" type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <label className="label" htmlFor="confirm-pw">{t('confirmPassword')}</label>
            <input id="confirm-pw" type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: 'var(--space-3)' }}>
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : t('resetPasswordTitle')}
          </button>
        </form>
      </div>
    </div>
  );
}
