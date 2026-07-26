import { beforeEach, describe, expect, it, vi } from 'vitest'

const presignedPutObjectMock = vi.fn()

vi.mock('minio', () => ({
  Client: vi.fn().mockImplementation(() => ({
    presignedPutObject: presignedPutObjectMock,
  })),
}))

describe('createMinioUploadSignedUrl', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.MINIO_ENDPOINT = 'files.example.com'
    process.env.MINIO_ACCESS_KEY = 'admin'
    process.env.MINIO_SECRET_KEY = 'secret'
    process.env.MINIO_BUCKET = 'ashrabha'
    process.env.MINIO_PUBLIC_URL = 'https://cdn.example.com'
    process.env.MINIO_PORT = '443'
    process.env.MINIO_USE_SSL = 'true'
  })

  it('creates a signed upload URL using the MinIO environment configuration', async () => {
    presignedPutObjectMock.mockResolvedValue('https://upload.example.com/object')

    const { createMinioUploadSignedUrl } = await import('@/lib/minio')

    const result = await createMinioUploadSignedUrl('hero.mp4', 'video/mp4', 'uploads')

    expect(result.uploadUrl).toBe('https://upload.example.com/object')
    expect(result.key).toBe('uploads/hero.mp4')
    expect(presignedPutObjectMock).toHaveBeenCalledWith('ashrabha', 'uploads/hero.mp4', 86400)
  })
})
