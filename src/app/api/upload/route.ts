import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { createMedia } from '@/lib/supabase/queries';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.AWS_BUCKET_NAME || '';

// File type detection
function getFileCategory(file: File): 'image' | 'document' | 'video' | 'audio' | 'other' {
  const mimeType = file.type.toLowerCase();
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('word') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  ) return 'document';
  
  return 'other';
}

// Upload to S3 (for images)
async function uploadImageToS3(file: File, userId: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Optimize image with Sharp
  const optimizedBuffer = await sharp(buffer)
    .resize(1920, 1920, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  const fileName = `images/${userId}/${Date.now()}-${file.name.split('.')[0]}.webp`;

  // Upload to S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: optimizedBuffer,
      ContentType: 'image/webp',
      CacheControl: 'max-age=31536000',
    })
  );

  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

// Upload to Supabase Storage (for documents, videos, etc.)
async function uploadToSupabaseStorage(
  file: File, 
  userId: string, 
  category: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  const storagePath = `${category}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage error: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

/**
 * Unified Upload API
 * 
 * POST /api/upload
 * 
 * FormData:
 * - file: File (required)
 * - userId: string (required)
 * - companyId: string (optional)
 * - category: 'profile' | 'banner' | 'document' | 'policy' | 'media' (optional)
 * 
 * Logic:
 * - Images → Optimize with Sharp → Upload to S3
 * - Documents/Videos/Audio → Upload to Supabase Storage
 * - Save metadata to Supabase database
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Unified Upload API started');
    const startTime = Date.now();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const companyId = formData.get('companyId') as string | null;
    const category = (formData.get('category') as string) || 'media';

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log(`📁 Processing: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Detect file type
    const fileType = getFileCategory(file);
    let fileUrl: string;
    let storageType: 's3' | 'supabase';

    // Route to appropriate storage based on file type
    if (fileType === 'image') {
      console.log('🖼️ Uploading image to S3...');
      fileUrl = await uploadImageToS3(file, userId);
      storageType = 's3';
    } else {
      console.log(`📄 Uploading ${fileType} to Supabase Storage...`);
      fileUrl = await uploadToSupabaseStorage(file, userId, category);
      storageType = 'supabase';
    }

    // Save metadata to Supabase database
    console.log('💾 Saving metadata to database...');
    const mediaRecord = await createMedia({
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size.toString(),
      company_id: companyId || userId, // Fallback to userId if no companyId
      uploaded_by: userId,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Upload completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileCategory: fileType,
        storageType,
        mediaId: mediaRecord.id,
        uploadDuration: duration,
      },
      message: 'File uploaded successfully',
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload?userId=xxx&limit=10
 * Get user's uploaded files
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch from Supabase
    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('uploaded_by', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: media,
      count: media?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ Fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Delete uploaded file
 * 
 * Body: { mediaId: string, userId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaId, userId } = body;

    if (!mediaId || !userId) {
      return NextResponse.json(
        { success: false, error: 'mediaId and userId are required' },
        { status: 400 }
      );
    }

    // Soft delete in database
    const { error } = await supabase
      .from('media')
      .update({ status: 'DELETED' })
      .eq('id', mediaId)
      .eq('uploaded_by', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error: any) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
