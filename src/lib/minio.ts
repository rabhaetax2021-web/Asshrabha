import { Client } from 'minio'

// Initialize MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'files.marymatelier.com',
  port: parseInt(process.env.MINIO_PORT || '443'),
  useSSL: process.env.MINIO_USE_SSL !== 'false',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'Admin123456',
  region: process.env.MINIO_REGION || 'us-east-1',
})

const BUCKET_NAME = process.env.MINIO_BUCKET || 'ashrabha'
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://files.marymatelier.com'

/**
 * Upload file to MinIO and return public URL
 * @param fileName - Name of the file (will be auto-generated with timestamp+uuid if not safe)
 * @param fileBuffer - File content as Buffer
 * @param contentType - MIME type (e.g., 'image/jpeg', 'application/pdf')
 * @param category - Optional category prefix (e.g., 'avatars', 'products')
 * @returns Public URL of uploaded file
 */
export async function uploadToMinIO(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string,
  category?: string
): Promise<string> {
  try {
    // Generate safe key with optional category prefix
    const key = category ? `${category}/${fileName}` : fileName

    // Upload to MinIO with metadata
    await minioClient.putObject(BUCKET_NAME, key, fileBuffer, fileBuffer.length, {
      'Content-Type': contentType,
    })

    // Return public URL
    const publicUrl = `${PUBLIC_URL}/${BUCKET_NAME}/${key}`
    return publicUrl
  } catch (error) {
    console.error('[minIO] Upload error:', error)
    throw new Error(`Failed to upload file to MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete file from MinIO
 * @param fileKey - Key of file to delete (with category prefix if applicable)
 */
export async function deleteFromMinIO(fileKey: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileKey)
  } catch (error) {
    console.error('[minIO] Delete error:', error)
    throw new Error(`Failed to delete file from MinIO: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate public URL for a file in MinIO
 * @param fileKey - Key of file in bucket
 * @returns Public URL
 */
export function getMinIOPublicUrl(fileKey: string): string {
  return `${PUBLIC_URL}/${BUCKET_NAME}/${fileKey}`
}

/**
 * Check if file exists in MinIO
 * @param fileKey - Key of file to check
 */
export async function fileExistsInMinIO(fileKey: string): Promise<boolean> {
  try {
    await minioClient.statObject(BUCKET_NAME, fileKey)
    return true
  } catch (error) {
    return false
  }
}

export { minioClient }
