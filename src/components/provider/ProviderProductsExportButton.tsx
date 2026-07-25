'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'

export default function ProviderProductsExportButton() {
  const t = useTranslations('admin')
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/provider/products/export')
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'provider-products.xlsx'
      document.body.appendChild(anchor)
      anchor.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(anchor)
    } catch (err) {
      console.error(err)
      alert('Failed to export products')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting}>
      {exporting ? t('exportingProducts') || 'Exporting...' : t('exportProducts') || 'Export Excel'}
    </Button>
  )
}
