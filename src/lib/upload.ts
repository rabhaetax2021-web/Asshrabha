export async function uploadFileToStorage(file: File, category = 'uploads'): Promise<string> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      category,
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.uploadUrl) {
    throw new Error(data?.error || 'Upload failed')
  }

  const uploadRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })

  if (!uploadRes.ok) {
    throw new Error('Upload failed')
  }

  return data.path || data.publicUrl || ''
}
