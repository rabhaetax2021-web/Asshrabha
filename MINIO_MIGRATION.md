# MinIO File Upload Migration Guide

**Status**: ✅ Completed  
**Build**: ✅ All 83 pages compiled successfully  
**TypeScript**: ✅ Zero errors

---

## Overview

Successfully migrated the file upload system from local filesystem storage to MinIO object storage. All file uploads now go through MinIO instead of saving to `public/uploads`.

## What Changed

### 1. **New MinIO Service** (`src/lib/minio.ts`)

Created a centralized MinIO service with helper functions:

- **`uploadToMinIO(fileName, fileBuffer, contentType, category)`** - Main upload function
  - Automatically prefixes files with category (e.g., `uploads/filename`, `avatars/filename`)
  - Returns full public URL
  - Handles errors gracefully

- **`deleteFromMinIO(fileKey)`** - Delete files from bucket

- **`getMinIOPublicUrl(fileKey)`** - Generate public URLs

- **`fileExistsInMinIO(fileKey)`** - Check file existence

### 2. **Updated Upload Endpoints**

#### `/api/upload` - General file uploads
- **Before**: Saved to `public/uploads/` folder
- **After**: Uploads to MinIO with `uploads/` prefix
- **Response**: Returns MinIO public URL instead of local path

#### `/api/user/avatar` - User avatar uploads  
- **Before**: Saved to `public/uploads/` folder
- **After**: Uploads to MinIO with `avatars/` prefix
- **Response**: Returns MinIO public URL, saves to `user.avatar` in database

### 3. **Environment Variables** (`.env`)

New MinIO configuration required:

```bash
# MinIO Configuration
MINIO_ENDPOINT="files.marymatelier.com"
MINIO_PORT="443"
MINIO_USE_SSL="true"
MINIO_ACCESS_KEY="your-access-key"          # ← UPDATE THIS
MINIO_SECRET_KEY="your-secret-key"          # ← UPDATE THIS
MINIO_REGION="us-east-1"
MINIO_BUCKET="ashrabha"
MINIO_PUBLIC_URL="http://files.marymatelier.com"
```

**⚠️ Important**: Replace the placeholder access keys with actual MinIO credentials.

### 4. **Dependencies Added**

- `minio` package (npm module for MinIO SDK)
- Added as production dependency in `package.json`

## File Organization in MinIO

Files are organized with category prefixes in the bucket:

```
ashrabha/
├── uploads/
│   ├── 1701234567890-a1b2c3d4.jpg
│   ├── 1701234567891-e5f6g7h8.png
│   └── ...
└── avatars/
    ├── 1701234567892-i9j0k1l2.jpg
    ├── 1701234567893-m3n4o5p6.png
    └── ...
```

**Filename Format**: `{timestamp}-{uuid}.{extension}`

## Public URLs

Files are accessed via the public MinIO endpoint:

```
http://files.marymatelier.com/ashrabha/uploads/1701234567890-a1b2c3d4.jpg
http://files.marymatelier.com/ashrabha/avatars/1701234567892-i9j0k1l2.jpg
```

## API Response Format

Both upload endpoints now return:

```json
{
  "ok": true,
  "path": "http://files.marymatelier.com/ashrabha/uploads/1701234567890-a1b2c3d4.jpg",
  "filePath": "http://files.marymatelier.com/ashrabha/uploads/1701234567890-a1b2c3d4.jpg"
}
```

## Backend Integration

### Using the MinIO Service

```typescript
import { uploadToMinIO, deleteFromMinIO } from '@/lib/minio'

// Upload a file
const publicUrl = await uploadToMinIO(
  filename,
  buffer,
  'image/jpeg',
  'uploads'  // category prefix
)

// Delete a file
await deleteFromMinIO('uploads/filename.jpg')
```

### In API Routes

Already integrated in:
- `src/app/api/upload/route.ts`
- `src/app/api/user/avatar/route.ts`

## Frontend Compatibility

✅ **No frontend changes required**

- Upload endpoints still accept `FormData` with `file` field
- Response format is compatible with existing code
- URLs are fully qualified (no more relative paths)

## Deployment Notes

### Development
1. Ensure MinIO credentials are in `.env`
2. MinIO endpoint should be reachable from your development machine

### Production (VPS)
1. Update `.env` with production MinIO credentials
2. Remove nginx `/uploads/` location block (updated in `VPS_DEPLOY_GUIDE.md`)
3. No need to maintain `public/uploads` directory anymore
4. MinIO handles all file serving

### Nginx Configuration Changes

**Before**:
```nginx
location /uploads/ {
    alias /var/www/asshrabha/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

**After**: (Removed - MinIO handles it)

---

## Verification Checklist

- ✅ MinIO package installed (`npm install minio`)
- ✅ `src/lib/minio.ts` service created
- ✅ Upload routes updated to use MinIO
- ✅ `.env` configured with MinIO variables
- ✅ Build successful (0 TypeScript errors)
- ✅ All 83 pages compile
- ✅ VPS deployment guide updated

## Next Steps

1. **Configure MinIO Credentials**
   - Update `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in `.env`
   - Test connectivity to MinIO endpoint

2. **Test Upload Functionality**
   - Upload a test file via `/api/upload`
   - Verify file appears in MinIO bucket
   - Confirm URL is accessible

3. **Test Avatar Upload**
   - Upload avatar as authenticated user
   - Verify `user.avatar` field in database has correct URL

4. **Monitor Production**
   - Watch for upload errors in logs
   - Verify files are accessible from public URLs
   - Monitor MinIO bucket usage

## Troubleshooting

### Connection Errors
```
Failed to upload file to MinIO: Connection refused
```
- Verify `MINIO_ENDPOINT` and `MINIO_PORT` in `.env`
- Check MinIO endpoint is reachable from your server
- Verify `MINIO_USE_SSL` matches your endpoint configuration

### Authentication Errors
```
Invalid access key id
```
- Check `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` are correct
- Verify credentials have bucket access permissions

### 404 on Public URLs
```
File not found at http://files.marymatelier.com/...
```
- Verify bucket is public/accessible
- Check filename is correct in MinIO
- Verify `MINIO_PUBLIC_URL` format is correct

## File Upload Size Limits

- Current limit: `client_max_body_size 10M` in nginx (from VPS guide)
- Adjust `MAX_FILE_SIZE_MB` in `.env` if needed
- MinIO itself supports much larger files

## Rollback Instructions

If you need to revert to local filesystem storage:

1. Restore old upload routes from git history
2. Remove MinIO variables from `.env`
3. Delete `src/lib/minio.ts`
4. Run `npm uninstall minio`
5. Create `public/uploads` directory
6. Rebuild: `npm run build`

## Related Files

- Upload endpoints: [src/app/api/upload/route.ts](src/app/api/upload/route.ts), [src/app/api/user/avatar/route.ts](src/app/api/user/avatar/route.ts)
- MinIO service: [src/lib/minio.ts](src/lib/minio.ts)
- Environment config: [.env](.env)
- Deployment guide: [VPS_DEPLOY_GUIDE.md](VPS_DEPLOY_GUIDE.md)

---

**Last Updated**: $(date)  
**Migrated By**: Copilot AI Assistant
