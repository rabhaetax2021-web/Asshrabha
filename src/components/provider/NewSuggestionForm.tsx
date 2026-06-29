"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function NewSuggestionForm() {
  const router = useRouter()
  const [nameEN, setNameEN] = useState('')
  const [nameAR, setNameAR] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [descriptionEN, setDescriptionEN] = useState('')
  const [descriptionAR, setDescriptionAR] = useState('')
  const [categorySuggestion, setCategorySuggestion] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleFileUpload(file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Upload failed')
    return data.path as string
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nameEN.trim() || !nameAR.trim()) {
      showToast('Please enter both English and Arabic names.', 'error')
      return
    }

    setLoading(true)
    try {
      const imageList = [...images]
      if (photoUrl.trim()) {
        imageList.push(photoUrl.trim())
      }

      const body = {
        nameEN: nameEN.trim(),
        nameAR: nameAR.trim(),
        descriptionEN: descriptionEN.trim() || undefined,
        descriptionAR: descriptionAR.trim() || undefined,
        images: imageList.length > 0 ? imageList : undefined,
        categorySuggestion: categorySuggestion.trim() || undefined,
      }

      const res = await fetch('/api/provider/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      showToast('Suggestion submitted for approval.', 'success')
      router.push('/provider/suggestions')
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploadedPaths: string[] = []
      for (const file of Array.from(files)) {
        const path = await handleFileUpload(file)
        uploadedPaths.push(path)
      }
      setImages((prev) => [...prev, ...uploadedPaths])
      showToast('Images uploaded successfully.', 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="provider-suggestion-form container">
      <h1>Suggest a New Catalog Product</h1>
      <form onSubmit={handleSubmit} className="form-grid">
        <label className="label">
          English Name
          <input className="input" value={nameEN} onChange={(e) => setNameEN(e.target.value)} placeholder="Product name in English" required dir="ltr" />
        </label>
        <label className="label">
          Arabic Name
          <input className="input" value={nameAR} onChange={(e) => setNameAR(e.target.value)} placeholder="اسم المنتج بالعربية" required dir="rtl" />
        </label>
        <label className="label">
          Photo URL
          <input className="input" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." dir="ltr" />
        </label>
        <label className="label">
          Upload Images
          <input className="input" type="file" accept="image/*" multiple onChange={handleFilesChange} />
        </label>
        {images.length > 0 && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            <strong>Uploaded images</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {images.map((image, index) => (
                <div key={index} style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  <img src={image} alt={`uploaded ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}
        <label className="label">
          English Description
          <textarea className="input" value={descriptionEN} onChange={(e) => setDescriptionEN(e.target.value)} placeholder="Optional description in English" rows={3} />
        </label>
        <label className="label">
          Arabic Description
          <textarea className="input" value={descriptionAR} onChange={(e) => setDescriptionAR(e.target.value)} placeholder="وصف اختياري بالعربية" rows={3} />
        </label>
        <label className="label">
          Category Suggestion
          <input className="input" value={categorySuggestion} onChange={(e) => setCategorySuggestion(e.target.value)} placeholder="Optional category name" dir="ltr" />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
            {loading ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit Suggestion'}
          </button>
        </div>
      </form>
    </section>
  )
}
