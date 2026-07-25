'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

export default function CatalogImportExport() {
  const t = useTranslations('admin')
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: Array<{ row: number; error: string }> } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleDownloadTemplate() {
    try {
      const res = await fetch('/api/admin/catalog-products/export/template')
      if (!res.ok) throw new Error('Download failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'products-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Failed to download template: ' + String(err))
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const reader = new FileReader()
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })

      window.sessionStorage.setItem('catalogImportFile', JSON.stringify({
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        data: fileData,
      }))
      window.location.href = '/admin/catalog/import'
    } catch (err) {
      setResult({
        imported: 0,
        errors: [{ row: 0, error: String(err) }]
      })
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="btn"
        onClick={() => setShowMenu(!showMenu)}
        style={{ position: 'relative' }}
      >
        📊 {t('importProducts') || 'Import'}
        <span style={{ marginLeft: 6 }}>▼</span>
      </button>

      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'white',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 50,
            minWidth: 220,
            marginTop: 4
          }}
        >
          <button
            type="button"
            onClick={() => {
              handleDownloadTemplate()
              setShowMenu(false)
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              borderBottom: '1px solid var(--border-light)'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            📥 {t('downloadProductSheet') || 'Download Sheet'}
          </button>

          <label
            style={{
              display: 'block',
              padding: 'var(--space-3) var(--space-4)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              userSelect: 'none'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              disabled={loading}
              style={{ display: 'none' }}
            />
            📤 {loading ? t('importing') || 'Importing...' : t('uploadProductSheet') || 'Upload Sheet'}
          </label>
        </div>
      )}

      {result && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: result.errors.length > 0 ? '#fee' : '#efe',
            border: `1px solid ${result.errors.length > 0 ? '#fcc' : '#cfc'}`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            zIndex: 1000,
            maxWidth: 400,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: 'var(--space-2)' }}>
            {result.errors.length > 0 ? '❌ Import Failed' : '✅ Import Successful'}
          </h4>

          {result.imported > 0 && (
            <p style={{ margin: 'var(--space-2) 0', fontSize: 'var(--text-sm)' }}>
              <strong>{result.imported} products imported</strong>
            </p>
          )}

          {result.errors.length > 0 && (
            <div style={{ fontSize: 'var(--text-sm)' }}>
              <strong>Errors:</strong>
              <ul style={{ margin: 'var(--space-2) 0 0 0', paddingLeft: 'var(--space-4)' }}>
                {result.errors.slice(0, 10).map((err, i) => (
                  <li key={i} style={{ marginBottom: 'var(--space-1)', color: '#c00' }}>
                    Row {err.row}: {err.error}
                  </li>
                ))}
                {result.errors.length > 10 && (
                  <li style={{ color: '#c00' }}>... and {result.errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setResult(null)}
            style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'rgba(0,0,0,0.1)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
