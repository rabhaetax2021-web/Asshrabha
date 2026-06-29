"use client"
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'

export default function TemplateEditor() {
  const t = useTranslations('admin')
  const [templates, setTemplates] = useState<Record<string,string>>({ otp_en: '', TEMPLATE_Marketing_Msg: '' })
  const [loading, setLoading] = useState(false)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [testMobile, setTestMobile] = useState('')
  const [mode, setMode] = useState<'otp'|'marketing'>('otp')
  const [marketingTemplateKey] = useState('TEMPLATE_Marketing_Msg')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/templates')
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      setTemplates(prev => ({ ...prev, ...(j.templates || {}) }))
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function renderTemplate(key: string) {
    let tpl = templates[key] || ''
    // Fallback for backwards compatibility: if otp_en is empty, try TEMPLATE_OTP
    if (key === 'otp_en' && !tpl && templates['TEMPLATE_OTP']) {
      tpl = templates['TEMPLATE_OTP']
    }
    if (!tpl) return ''
    if (key === 'otp_en') {
      const code = '123456'
      const appName = 'Asshrabha'
      const minutes = '3'
      const supportPhone = '123-456-7890'
      // {{1}} = code, {{2}} = app name, {{3}} = expiry minutes, {{4}} = support number
      let result = String(tpl).replace(/{{1}}/g, code)
      result = result.replace(/{{2}}/g, appName)
      result = result.replace(/{{3}}/g, minutes)
      result = result.replace(/{{4}}/g, supportPhone)
      return result
    }
    // simple replacement for up to 5 placeholders
    let out = String(tpl)
    for (let i = 0; i < 5; i++) out = out.replace(new RegExp(`{{${i+1}}}`, 'g'), `Sample${i+1}`)
    return out
  }

  function previewTemplate(key: string) {
    const text = renderTemplate(key)
    setPreviewText(text || 'No template content')
    setShowPreview(true)
  }

  function normalizeMobile(mobile?: string) {
    let to = (mobile || testMobile || '').trim()
    if (!to) return ''
    const plus = to.startsWith('+') ? '+' : ''
    to = plus + to.replace(/[^0-9]/g, '')
    return to
  }

  async function sendOtpTest(mobile?: string) {
    const to = normalizeMobile(mobile)
    if (!to) return showToast('Enter test mobile', 'error')
    try {
      const res = await fetch('/api/auth/whatsapp-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile: to }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast('OTP test sent (or simulated)', 'success')
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    }
  }

  async function sendMarketingTest(mobile?: string) {
    const to = normalizeMobile(mobile)
    if (!to) return showToast('Enter test mobile', 'error')
    try {
      const body: any = { recipients: [to], templateName: marketingTemplateKey }
      const res = await fetch('/api/admin/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast(`Marketing test prepared for ${j.count} recipients`, 'success')
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3>{t('messageTemplates') || 'Message Templates (Test)'}</h3>
      {loading ? <div>Loading templates...</div> : (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ marginRight: 8 }}>Mode:</label>
              <select value={mode} onChange={e => setMode(e.target.value as any)}>
                <option value="otp">OTP</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>

            <div style={{ marginBottom: 8 }}>
              <input placeholder={t('testMobile') || 'Test mobile'} value={testMobile} onChange={e => setTestMobile(e.target.value)} style={{ padding: '6px 8px', width: 300 }} />
            </div>

            {mode === 'otp' ? (
              <div>
                <div style={{ marginBottom: 6 }}>
                  <label>{t('otpTemplateLabel') || 'OTP Template ({{1}}=code, {{2}}=app name, {{3}}=expiry, {{4}}=support phone)'}</label>
                  <div style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, borderRadius: 4 }}>{renderTemplate('otp_en') || 'No OTP template'}</div>
                </div>
                <div>
                  <button className="btn btn-ghost" onClick={() => previewTemplate('otp_en')}>{t('preview') || 'Preview'}</button>
                  <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={() => sendOtpTest()}>{t('testOtp') || 'Test OTP'}</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 6 }}>
                  <label>{t('marketingTemplateLabel') || 'Marketing Template'}</label>
                  <div style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, borderRadius: 4 }}>{renderTemplate('TEMPLATE_Marketing_Msg') || 'No marketing template'}</div>
                </div>
                <div>
                  <button className="btn btn-ghost" onClick={() => previewTemplate('TEMPLATE_Marketing_Msg')}>{t('preview') || 'Preview'}</button>
                  <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={() => sendMarketingTest()}>{t('testMarketing') || 'Test Marketing'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPreview && previewText && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 640, background: 'white', borderRadius: 8, padding: 20 }}>
            <h4 style={{ marginTop: 0 }}>{t('preview') || 'Preview'}</h4>
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{previewText}</div>
            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-ghost" onClick={() => { setShowPreview(false); setPreviewText(null); }}>{t('close') || 'Close'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
