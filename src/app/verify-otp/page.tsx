'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { verifyOTPAction, resendOTPAction } from '@/lib/actions/auth.actions';
import { OTP_RESEND_COOLDOWN_SECONDS, OTP_LENGTH } from '@/lib/utils/constants';

export default function VerifyOTPPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || '';

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasteData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtp(newOtp);
      if (pasteData.length === OTP_LENGTH) {
        handleVerify(pasteData);
      } else {
        inputRefs.current[pasteData.length]?.focus();
      }
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');

    const result = await verifyOTPAction(userId, code);
    if (result.success) {
      router.push('/pending');
    } else {
      setError(t('otpInvalid'));
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(OTP_RESEND_COOLDOWN_SECONDS);
    await resendOTPAction(userId);
  };

  return (
    <div className="login-page">
      <div className="login-card glass" style={{ animation: 'scaleIn var(--transition-slow) ease-out', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🔐</div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            {t('otpTitle')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            {t('otpSubtitle')}
          </p>
        </div>

        {error && (
          <div style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'hsla(0, 84%, 60%, 0.1)',
            border: '1px solid hsla(0, 84%, 60%, 0.3)',
            color: 'var(--error)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)',
            animation: 'shake 0.5s ease-in-out',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="otp-input-group" onPaste={handlePaste} style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
          direction: 'ltr',
        }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`otp-input ${digit ? 'otp-input-filled' : ''}`}
              disabled={loading}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={() => handleVerify(otp.join(''))}
          className="btn-primary"
          disabled={loading || otp.some((d) => !d)}
          style={{ width: '100%', padding: 'var(--space-3)', marginBottom: 'var(--space-4)' }}
        >
          {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : t('verifyButton')}
        </button>

        {/* Resend */}
        <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          {canResend ? (
            <button onClick={handleResend} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'var(--font-semibold)' }}>
              {t('resendCode')}
            </button>
          ) : (
            <span>{t('resendIn', { seconds: countdown })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
