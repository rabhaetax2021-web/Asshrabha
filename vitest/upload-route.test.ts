import { describe, expect, it, vi, beforeEach } from 'vitest'

const uploadMock = vi.fn(async (_filename: string, _buffer: Buffer, _contentType: string, _category?: string) => {
  return 'https://cdn.example.com/ashrabha/uploads/test.png'
})

vi.mock('@/lib/minio', () => ({
  uploadToMinIO: uploadMock,
  createMinioUploadSignedUrl: vi.fn(),
}))

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('uploads multipart form files and returns a public path', async () => {
    const { POST } = await import('@/app/api/upload/route')

    const formData = new FormData()
    const blob = new Blob(['hello world'], { type: 'image/png' })
    formData.append('file', blob, 'test.png')

    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders ? formData.getHeaders() as HeadersInit : undefined,
    })

    const response = await POST(req as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.path).toBe('https://cdn.example.com/ashrabha/uploads/test.png')
    expect(uploadMock).toHaveBeenCalledOnce()
    expect(uploadMock.mock.calls[0][0]).toMatch(/\.png$/)
    expect(uploadMock.mock.calls[0][1]).toBeInstanceOf(Buffer)
    expect((uploadMock.mock.calls[0][1] as Buffer).length).toBeGreaterThan(0)
  })
})
