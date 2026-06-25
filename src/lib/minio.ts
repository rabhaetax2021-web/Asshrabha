import { Client } from 'minio'
import fs from 'fs'
import path from 'path'

// Check if MinIO is properly configured
const hasValidMinIOCredentials = () => {
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY
  
  // Check if credentials are placeholder values
  if (!accessKey || accessKey === 'your-access-key' || accessKey === 'admin') return false
  if (!secretKey || secretKey === 'your-secret-key' || secretKey === 'Admin123456') return false
  
  return true
}

let minioClient: Client | null = null

if (hasValidMinIOCredentials()) {
  minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'files.marymatelier.com',
    port: parseInt(process.env.MINIO_PORT || '443'),
    useSSL: process.env.MINIO_USE_SSL !== 'false',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
    region: process.env.MINIO_REGION || 'us-east-1',
  })
} else {
  console.warn('[MinIO] Invalid or missing credentials. Falling back to local filesystem storage.')
}

const BUCKET_NAME = process.env.MINIO_BUCKET || 'ashrabha'
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://files.marymatelier.com'

// Fallback to local filesystem if MinIO not configured
const USE_LOCAL_STORAGE = !minioClient

/**
 * Upload file to MinIO or fallback to local filesystem
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
    if (minioClient && USE_LOCAL_STORAGE === false) {
      // Use MinIO
      const key = category ? `${category}/${fileName}` : fileName

      await minioClient.putObject(BUCKET_NAME, key, fileBuffer, fileBuffer.length, {
        'Content-Type': contentType,
      })

      const publicUrl = `${PUBLIC_URL}/${BUCKET_NAME}/${key}`
      console.log('[MinIO] File uploaded successfully:', key)
      return publicUrl
    } else {
      // Fallback to local filesystem
      return uploadToLocalFilesystem(fileName, fileBuffer, category)
    }
  } catch (error) {
    console.error('[upload] MinIO error:', error)
    // Try local fallback if MinIO fails
    if (minioClient) {
      console.warn('[upload] MinIO failed, falling back to local filesystem')
      return uploadToLocalFilesystem(fileName, fileBuffer, category)
    }
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload file to local filesystem (fallback)
 */
function uploadToLocalFilesystem(
  fileName: string,
  fileBuffer: Buffer,
  category?: string
): string {
  try {
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const relativePath = category ? `${category}/${fileName}` : fileName
    const fullPath = path.join(uploadsDir, relativePath)
    
    // Create category subdirectory if needed
    const categoryDir = path.dirname(fullPath)
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }

    fs.writeFileSync(fullPath, fileBuffer)
    
    const publicPath = `/uploads/${relativePath}`.replace(/\\/g, '/')
    console.log('[upload] File saved locally:', publicPath)
    return publicPath
  } catch (error) {
    console.error('[upload] Local filesystem error:', error)
    throw new Error(`Failed to save file locally: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete file from MinIO or local filesystem
 * @param fileKey - Key of file to delete (with category prefix if applicable)
 */
export async function deleteFromMinIO(fileKey: string): Promise<void> {
  try {
    if (minioClient && USE_LOCAL_STORAGE === false) {
      await minioClient.removeObject(BUCKET_NAME, fileKey)
      console.log('[MinIO] File deleted:', fileKey)
    } else {
      deleteFromLocalFilesystem(fileKey)
    }
  } catch (error) {
    console.error('[upload] Delete error:', error)
    if (minioClient && USE_LOCAL_STORAGE === false) {
      // Try local fallback
      console.warn('[upload] MinIO delete failed, trying local filesystem')
      deleteFromLocalFilesystem(fileKey)
    } else {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

/**
 * Delete file from local filesystem
 */
function deleteFromLocalFilesystem(fileKey: string): void {
  try {
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
    const fullPath = path.join(uploadsDir, fileKey)
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      console.log('[upload] File deleted locally:', fileKey)
    }
  } catch (error) {
    console.error('[upload] Local filesystem delete error:', error)
  }
}

/**
 * Generate public URL for a file in MinIO or local storage
 * @param fileKey - Key of file in bucket or path
 * @returns Public URL
 */
export function getMinIOPublicUrl(fileKey: string): string {
  if (minioClient && USE_LOCAL_STORAGE === false) {
    return `${PUBLIC_URL}/${BUCKET_NAME}/${fileKey}`
  } else {
    return `/uploads/${fileKey}`.replace(/\\/g, '/')
  }
}

/**
 * Check if file exists in MinIO or local filesystem
 * @param fileKey - Key of file to check
 */
export async function fileExistsInMinIO(fileKey: string): Promise<boolean> {
  try {
    if (minioClient && USE_LOCAL_STORAGE === false) {
      await minioClient.statObject(BUCKET_NAME, fileKey)
      return true
    } else {
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
      const fullPath = path.join(uploadsDir, fileKey)
      return fs.existsSync(fullPath)
    }
  } catch (error) {
    return false
  }
}

export { minioClient }
