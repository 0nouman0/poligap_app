# 🗄️ Supabase Storage Setup Guide

## Overview

The unified upload API (`/api/upload`) uses:
- **AWS S3** for images (optimized with Sharp)
- **Supabase Storage** for documents, videos, and other files

This guide shows you how to set up Supabase Storage buckets.

---

## 📋 Prerequisites

- Supabase project created
- Supabase credentials in `.env.local`:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

---

## 🚀 Setup Supabase Storage

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to Storage**
   - Open your Supabase project dashboard
   - Click **Storage** in the left sidebar

2. **Create Bucket**
   - Click **New bucket**
   - Name: `uploads`
   - Public: ✅ Yes (for CDN access)
   - File size limit: `52428800` (50 MB)
   - Allowed MIME types: Leave empty (allow all)

3. **Create Folders** (Optional but recommended)
   - Inside `uploads` bucket, create folders:
     - `document/`
     - `policy/`
     - `media/`
     - `profile/`
     - `banner/`

4. **Set Policies** (Important!)
   - Go to **Storage** → **Policies** tab
   - Click **New Policy** on `uploads` bucket

   **Policy 1: Allow authenticated uploads**
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'uploads');
   ```

   **Policy 2: Allow public reads**
   ```sql
   CREATE POLICY "Allow public reads"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'uploads');
   ```

   **Policy 3: Allow user to delete own files**
   ```sql
   CREATE POLICY "Allow users to delete own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'uploads' AND owner = auth.uid());
   ```

---

### Option 2: Via SQL (Automated)

Run this SQL in your Supabase SQL Editor:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('uploads', 'uploads', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Policy 2: Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Policy 3: Allow users to delete own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND owner = auth.uid());

-- Policy 4: Allow service role full access
CREATE POLICY "Allow service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'uploads');
```

---

### Option 3: Via Supabase CLI

```bash
# Create bucket
supabase storage create uploads --public

# Set file size limit (50 MB)
supabase storage update uploads --file-size-limit 52428800

# Apply RLS policies (create a file: storage-policies.sql)
supabase db push
```

---

## 🔧 Configure Upload API

The unified upload API is already configured to use Supabase Storage.

**Location**: `src/app/api/upload/route.ts`

**How it works**:
```typescript
POST /api/upload

FormData:
- file: File (required)
- userId: string (required)
- companyId: string (optional)
- category: 'profile' | 'banner' | 'document' | 'policy' | 'media' (optional)

Response:
{
  success: true,
  data: {
    fileUrl: "https://...",
    fileName: "document.pdf",
    fileType: "application/pdf",
    fileSize: 123456,
    fileCategory: "document",
    storageType: "supabase", // or "s3" for images
    mediaId: "uuid",
    uploadDuration: 1234
  }
}
```

---

## 📝 Usage Examples

### Frontend Upload Example

```typescript
// Upload image (goes to S3)
async function uploadImage(file: File, userId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('category', 'profile');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  console.log('Image URL:', result.data.fileUrl);
  console.log('Storage:', result.data.storageType); // "s3"
}

// Upload document (goes to Supabase Storage)
async function uploadDocument(file: File, userId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('category', 'document');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  console.log('Document URL:', result.data.fileUrl);
  console.log('Storage:', result.data.storageType); // "supabase"
}
```

### Get User's Files

```typescript
async function getUserFiles(userId: string) {
  const response = await fetch(`/api/upload?userId=${userId}&limit=50`);
  const result = await response.json();
  
  console.log('Files:', result.data);
  console.log('Count:', result.count);
}
```

### Delete File

```typescript
async function deleteFile(mediaId: string, userId: string) {
  const response = await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaId, userId }),
  });

  const result = await response.json();
  console.log('Deleted:', result.success);
}
```

---

## 🔍 Verify Setup

### 1. Check Bucket Exists

```bash
# Via Supabase CLI
supabase storage list
```

Should show: `uploads`

### 2. Test Upload

```bash
# Upload test file via API
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf" \
  -F "userId=test-user-123" \
  -F "category=document"
```

### 3. Check Storage Dashboard

- Go to Supabase Dashboard → Storage → uploads
- You should see your uploaded file

---

## 🎯 File Routing Logic

| File Type | Storage | Optimization | Public |
|-----------|---------|--------------|--------|
| **Images** (jpg, png, gif, etc.) | AWS S3 | ✅ Sharp + WebP | ✅ Yes |
| **Documents** (pdf, docx, etc.) | Supabase Storage | ❌ No | ✅ Yes |
| **Videos** (mp4, mov, etc.) | Supabase Storage | ❌ No | ✅ Yes |
| **Audio** (mp3, wav, etc.) | Supabase Storage | ❌ No | ✅ Yes |
| **Other** | Supabase Storage | ❌ No | ✅ Yes |

---

## 🔒 Security Features

### Authentication
- Service role key used for server-side uploads
- User ID required for all uploads
- Files tagged with uploader info

### Storage Policies (RLS)
- ✅ Authenticated users can upload
- ✅ Public can read (for CDN)
- ✅ Users can delete own files only
- ✅ Service role has full access

### File Validation
- ✅ File type detection
- ✅ Size limits enforced
- ✅ MIME type validation
- ✅ Metadata saved to database

---

## 📊 Monitoring

### Check Upload Stats

```sql
-- Total uploads
SELECT COUNT(*) FROM media WHERE status = 'ACTIVE';

-- Uploads by type
SELECT file_type, COUNT(*) 
FROM media 
WHERE status = 'ACTIVE'
GROUP BY file_type;

-- Uploads by user
SELECT uploaded_by, COUNT(*) as upload_count
FROM media 
WHERE status = 'ACTIVE'
GROUP BY uploaded_by
ORDER BY upload_count DESC
LIMIT 10;

-- Total storage used
SELECT 
  SUM(CAST(file_size AS BIGINT)) as total_bytes,
  SUM(CAST(file_size AS BIGINT)) / 1024 / 1024 as total_mb
FROM media 
WHERE status = 'ACTIVE';
```

---

## 🚨 Troubleshooting

### Error: "Bucket not found"
- Create `uploads` bucket in Supabase Dashboard
- Make sure it's set to **public**

### Error: "Permission denied"
- Check RLS policies are created
- Verify service role key is correct in `.env.local`

### Error: "File too large"
- Default limit: 50 MB
- Increase in bucket settings if needed

### Images not optimizing
- Check Sharp package is installed: `npm install sharp`
- Verify S3 credentials are correct

### Files not saving to database
- Check `media` table exists in Supabase
- Verify migration was run successfully

---

## 🎉 Benefits of Unified Upload

✅ **Single API** - One endpoint for all uploads
✅ **Smart Routing** - Images → S3, Docs → Supabase
✅ **Optimized** - Images auto-compressed with WebP
✅ **Scalable** - Works in serverless environments
✅ **Tracked** - All uploads saved to database
✅ **Secure** - RLS policies + authentication
✅ **Fast** - CDN delivery for all files

---

## 📞 Next Steps

1. ✅ Create Supabase Storage bucket (follow Option 1 above)
2. ✅ Apply RLS policies
3. ✅ Test upload with curl command
4. ✅ Update frontend components to use `/api/upload`
5. ✅ Monitor uploads in Supabase Dashboard

---

**Last Updated**: 2024  
**Status**: Production Ready  
**Documentation**: Complete
