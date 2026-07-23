'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { registerAction } from '@/lib/actions/auth.actions';
import Link from 'next/link';

type AccountType = 'CUSTOMER' | 'PROVIDER' | null;
type CustomerType = 'SHOP' | 'CUSTOMER' | null;
type Step = 'type' | 'client-type' | 'info' | 'provider-info';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();

  const [step, setStep] = useState<Step>('type');
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [customerType, setCustomerType] = useState<CustomerType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameAR, setNameAR] = useState('');
  const [nameEN, setNameEN] = useState('');
  const [shopNameAR, setShopNameAR] = useState('');
  const [shopNameEN, setShopNameEN] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationUrl, setLocationUrl] = useState<string>('');
  const [locations, setLocations] = useState<{ id: string; nameEN?: string; nameAR?: string }[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/locations')
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        setLocations(j?.ok ? j.locations : []);
      })
      .catch(() => { if (mounted) setLocations([]) });
    return () => { mounted = false };
  }, []);

  const handleTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setCustomerType(null);
    if (type === 'CUSTOMER') {
      setStep('client-type');
    } else {
      setStep('info');
    }
  };

  async function uploadFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    return res.json()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      setLoading(true)
      const data: any = await uploadFile(f)
      if (data?.ok && data.path) {
        setAvatarUrl(data.path)
      } else {
        setError('Upload failed')
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleProviderLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      setLoading(true)
      const data: any = await uploadFile(f)
      if (data?.ok && data.path) {
        setLogoUrl(data.path)
      } else {
        setError('Upload failed')
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleProviderBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      setLoading(true)
      const data: any = await uploadFile(f)
      if (data?.ok && data.path) {
        setBannerUrl(data.path)
      } else {
        setError('Upload failed')
      }
    } catch (err) {
      setError('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwordMatch') || 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError(t('passwordRequirements'));
      return;
    }
    // Require both address line and selected governorate for customers
    if (accountType === 'CUSTOMER' && (!locationAddress.trim() || !locationId)) {
      setError('الرجاء إدخال عنوانك واختيار المحافظة / Please enter your address and select governorate');
      return;
    }

    // Require location for providers as well
    if (accountType === 'PROVIDER' && !locationAddress.trim()) {
      setError('الرجاء إدخال موقع المتجر / Please enter your store location');
      return;
    }
    if (accountType === 'CUSTOMER' && !customerType) {
      setError('Please select customer type');
      return;
    }

    setError('');
    if (accountType === 'PROVIDER') {
      setStep('provider-info');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await registerAction({
        mobile,
        password,
        nameAR,
        nameEN,
        role: accountType!,
        customerType: accountType === 'CUSTOMER' ? (customerType || 'CUSTOMER') : undefined,
        shopNameAR: accountType === 'PROVIDER' ? shopNameAR : undefined,
        shopNameEN: accountType === 'PROVIDER' ? shopNameEN : undefined,
        // include location for both providers and customers
        locationAddress: locationAddress || undefined,
        locationId: locationId || undefined,
        locationLat: locationLat ?? undefined,
        locationLng: locationLng ?? undefined,
        locationUrl: locationUrl || undefined,
        avatar: avatarUrl || undefined,
        logo: accountType === 'PROVIDER' ? (logoUrl || avatarUrl || undefined) : undefined,
        banner: accountType === 'PROVIDER' ? (bannerUrl || undefined) : undefined,
      });

      if (result.success && result.data) {
        router.push(`/verify-otp?userId=${result.data.userId}`);
      } else {
        switch (result.error) {
          case 'MOBILE_EXISTS':
            setError('رقم الجوال مسجل مسبقاً / Mobile number already registered');
            break;
          case 'MISSING_LOCATION':
            setError('الرجاء إدخال موقعك / Please enter your location');
            break;
          case 'REGISTRATION_DISABLED':
            setError('التسجيل معطل حالياً / Registration is currently disabled');
            break;
          default:
            setError('فشل التسجيل / Registration failed');
        }
      }
    } catch {
      setError('حدث خطأ / An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case 'type': return 1;
      case 'client-type': return 2;
      case 'info': return accountType === 'CUSTOMER' ? 3 : 2;
      case 'provider-info': return 3;
      default: return 1;
    }
  };

  const totalSteps = accountType === 'PROVIDER' ? 3 : accountType === 'CUSTOMER' ? 3 : 1;

  return (
    <div className="login-page">
      <div className="login-card glass" style={{ animation: 'scaleIn var(--transition-slow) ease-out', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            {t('registerTitle')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            {t('registerSubtitle')}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="register-steps" style={{ marginBottom: 'var(--space-6)' }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`register-step ${i + 1 <= getStepNumber() ? 'register-step-active' : ''} ${i + 1 < getStepNumber() ? 'register-step-completed' : ''}`}
            >
              <div className="register-step-circle">{i + 1}</div>
            </div>
          ))}
        </div>

        {/* Error */}
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
          }}>
            {error}
          </div>
        )}

        {/* Step: Choose Account Type */}
        {step === 'type' && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', textAlign: 'center' }}>
              {t('chooseAccountType')}
            </h2>

            <button
              onClick={() => handleTypeSelect('CUSTOMER')}
              className="card card-interactive"
              style={{ padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer', border: '2px solid transparent' }}
            >
              <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>🛍️</div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                {t('customerAccount')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                {t('customerDescription')}
              </p>
            </button>

            <button
              onClick={() => handleTypeSelect('PROVIDER')}
              className="card card-interactive"
              style={{ padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer', border: '2px solid transparent' }}
            >
              <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>🏪</div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                {t('providerAccount')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                {t('providerDescription')}
              </p>
            </button>
          </div>
        )}

        {/* Step: Choose Customer Type */}
        {step === 'client-type' && (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', textAlign: 'center' }}>
              اختر نوع الحساب / Choose account type
            </h2>

            <button
              onClick={() => { setCustomerType('SHOP'); setStep('info'); }}
              className="card card-interactive"
              style={{ padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer', border: '2px solid transparent' }}
            >
              <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>🏬</div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                {t('shopCustomerRoleLabel')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                {t('shopCustomerRoleDescription')}
              </p>
            </button>

            <button
              onClick={() => { setCustomerType('CUSTOMER'); setStep('info'); }}
              className="card card-interactive"
              style={{ padding: 'var(--space-6)', textAlign: 'center', cursor: 'pointer', border: '2px solid transparent' }}
            >
              <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>🛒</div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                {t('userClientRoleLabel')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                {t('userClientRoleDescription')}
              </p>
            </button>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button type="button" className="btn-secondary" onClick={() => { setStep('type'); setAccountType(null); setCustomerType(null); }} style={{ flex: 1 }}>
                {tc('back')}
              </button>
            </div>
          </div>
        )}

        {/* Step: Personal Info */}
        {step === 'info' && (
          <form onSubmit={handleInfoSubmit}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
              {t('personalInfo')}
            </h2>

            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div>
                <label className="label" htmlFor="nameAR">الاسم (عربي) *</label>
                <input id="nameAR" className="input" value={nameAR} onChange={(e) => setNameAR(e.target.value)} required dir="rtl" />
              </div>
              <div>
                <label className="label" htmlFor="nameEN">Name (English) *</label>
                <input id="nameEN" className="input" value={nameEN} onChange={(e) => setNameEN(e.target.value)} required dir="ltr" />
              </div>
              <div>
                <label className="label">{t('profilePhoto') || 'Profile Photo'}</label>
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
                {avatarUrl && <div style={{marginTop:8}}><img src={avatarUrl} alt="avatar" style={{maxWidth:120,maxHeight:120,borderRadius:8}}/></div>}
              </div>
              <div>
                <label className="label" htmlFor="reg-mobile">{t('mobileNumber')} *</label>
                <input id="reg-mobile" type="tel" className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} required dir="ltr" placeholder="01XXXXXXXXX" />
              </div>
              {accountType === 'CUSTOMER' && (
                <div>
                  <label className="label" htmlFor="locationAddress">{t('locationAddress')} *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input id="locationAddress" className="input" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} required placeholder="Street, building, apartment" />
                    <button
                      id="customer-get-location-btn"
                      type="button"
                      className="btn btn-primary"
                      aria-label={t('useMyLocation') || 'Use my location'}
                      onClick={() => {
                        if (!('geolocation' in navigator)) { setError(t('geolocationUnavailable') || 'Geolocation not available'); return }
                        setLoading(true)
                        navigator.geolocation.getCurrentPosition((pos) => {
                          const lat = pos.coords.latitude
                          const lng = pos.coords.longitude
                          setLocationLat(lat)
                          setLocationLng(lng)
                          setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`)
                          setLoading(false)
                        }, (err) => { setError(err?.message || (t('permissionDenied') || 'Permission denied')); setLoading(false) }, { enableHighAccuracy: true, timeout: 15000 })
                    }}>{loading ? '…' : (t('useMyLocation') || 'Use my location')}</button>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label className="label" htmlFor="locationId">{t('government') || 'Governorate'} *</label>
                    <select id="locationId" className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)} required>
                      <option value="">-- {t('select') || 'Select'} --</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.nameAR || l.nameEN || l.id}</option>
                      ))}
                    </select>
                  </div>
                  {(locationUrl || locationAddress.trim()) && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <a
                        href={locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationAddress}${locationId ? `, ${locations.find((l) => l.id === locationId)?.nameEN || locationId}` : ''}`)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('previewLocation') || 'Preview location on map'}
                      </a>
                      {locationUrl && (
                        <button type="button" className="btn-secondary" onClick={() => { setLocationUrl(''); setLocationLat(null); setLocationLng(null); }}>{tc('remove') || 'Remove'}</button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {accountType === 'PROVIDER' && (
                <div>
                  <label className="label" htmlFor="locationAddress">{t('locationAddress')} *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input id="locationAddress" className="input" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} required placeholder="Street, building, apartment" />
                    <button
                      id="shop-get-location-btn"
                      type="button"
                      className="btn btn-primary"
                      aria-label={t('useMyLocation') || 'Use my location'}
                      onClick={() => {
                        if (!('geolocation' in navigator)) { setError(t('geolocationUnavailable') || 'Geolocation not available'); return }
                        setLoading(true)
                        navigator.geolocation.getCurrentPosition((pos) => {
                          const lat = pos.coords.latitude
                          const lng = pos.coords.longitude
                          setLocationLat(lat)
                          setLocationLng(lng)
                          // build a Google Maps URL and store it
                          const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                          setLocationUrl(url)
                          setLoading(false)
                        }, (err) => { setError(err?.message || (t('permissionDenied') || 'Permission denied')); setLoading(false) }, { enableHighAccuracy: true, timeout: 15000 })
                    }}>{loading ? '…' : (t('useMyLocation') || 'Use my location')}</button>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label className="label" htmlFor="locationId">{t('government') || 'Governorate'}</label>
                    <select id="locationId" className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)} required>
                      <option value="">-- {t('select') || 'Select'} --</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.nameAR || l.nameEN || l.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="label" htmlFor="reg-password">{t('password')} *</label>
                <input id="reg-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <div>
                <label className="label" htmlFor="reg-confirm">{t('confirmPassword')} *</label>
                <input id="reg-confirm" type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button type="button" className="btn-secondary" onClick={() => { setStep('type'); setAccountType(null); }} style={{ flex: 1 }}>
                {tc('back')}
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                {accountType === 'PROVIDER' ? tc('next') : tc('submit')}
              </button>
            </div>
          </form>
        )}

        {/* Step: Provider Store Info */}
        {step === 'provider-info' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
              {t('storeInfo')}
            </h2>

            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div>
                <label className="label" htmlFor="shopNameAR">{t('storeNameAR')} *</label>
                <input id="shopNameAR" className="input" value={shopNameAR} onChange={(e) => setShopNameAR(e.target.value)} required dir="rtl" />
              </div>
              <div>
                <label className="label" htmlFor="shopNameEN">{t('storeNameEN')} *</label>
                <input id="shopNameEN" className="input" value={shopNameEN} onChange={(e) => setShopNameEN(e.target.value)} required dir="ltr" />
              </div>
              <div>
                <label className="label" htmlFor="locationAddress">{t('locationAddress')} *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input id="locationAddress" className="input" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} required placeholder="Street, building, apartment" />
                  <button
                    id="shop-get-location-btn"
                    type="button"
                    className="btn btn-primary"
                    aria-label={t('useMyLocation') || 'Use my location'}
                    onClick={() => {
                      if (!('geolocation' in navigator)) { setError(t('geolocationUnavailable') || 'Geolocation not available'); return }
                      setLoading(true)
                      navigator.geolocation.getCurrentPosition((pos) => {
                        const lat = pos.coords.latitude
                        const lng = pos.coords.longitude
                        setLocationLat(lat)
                        setLocationLng(lng)
                        setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`)
                        setLoading(false)
                      }, (err) => { setError(err?.message || (t('permissionDenied') || 'Permission denied')); setLoading(false) }, { enableHighAccuracy: true, timeout: 15000 })
                  }}>{loading ? '…' : (t('useMyLocation') || 'Use my location')}</button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <label className="label" htmlFor="locationId">{t('government') || 'Government'}</label>
                  <select id="locationId" className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                    <option value="">-- {t('select') || 'Select'} --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.nameAR || l.nameEN || l.id}</option>
                    ))}
                  </select>
                </div>
                {locationUrl ? (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <a href={locationUrl} target="_blank" rel="noreferrer">{t('previewLocation') || 'Preview location on map'}</a>
                    <button type="button" className="btn-secondary" onClick={() => { setLocationUrl(''); setLocationLat(null); setLocationLng(null); }}>{tc('remove') || 'Remove'}</button>
                  </div>
                ) : (locationLat != null && locationLng != null && (
                  <div style={{ marginTop: 8 }}>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${locationLat},${locationLng}`} target="_blank" rel="noreferrer">{t('previewMaps') || 'Preview GPS location in Google Maps'}</a>
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Store Logo</label>
                <input type="file" accept="image/*" onChange={handleProviderLogoChange} />
                {logoUrl && <div style={{marginTop:8}}><img src={logoUrl} alt="store logo" style={{maxWidth:240,maxHeight:120}}/></div>}
              </div>
              <div>
                <label className="label">Store Cover</label>
                <input type="file" accept="image/*" onChange={handleProviderBannerChange} />
                {bannerUrl && <div style={{marginTop:8}}><img src={bannerUrl} alt="store cover" style={{maxWidth:240,maxHeight:120}}/></div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep('info')} style={{ flex: 1 }}>
                {tc('back')}
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2 }}>
                {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} /> : tc('submit')}
              </button>
            </div>
          </form>
        )}

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          {t('hasAccount')}{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 'var(--font-semibold)', textDecoration: 'none' }}>
            {t('signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
