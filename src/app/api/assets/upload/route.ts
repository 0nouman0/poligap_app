import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Upload to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    // Save metadata to assets table
    const { data: assetData, error: dbError } = await supabase
      .from('assets')
      .insert({
        filename: filename,
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        category: getCategoryFromMimeType(file.type),
        file_path: uploadData.path,
        storage_type: 'supabase',
        user_id: userId || null,
        tags: [],
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('uploads').remove([filename]);
      return NextResponse.json(
        { success: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Return asset in format expected by frontend
    const asset = {
      _id: assetData.id,
      filename: assetData.filename,
      originalName: assetData.original_name,
      mimetype: assetData.mime_type,
      size: assetData.file_size,
      uploadDate: assetData.upload_date,
      url: publicUrl,
      tags: assetData.tags || [],
      category: assetData.category,
    };

    return NextResponse.json({
      success: true,
      asset: asset
    });
  } catch (error) {
    console.error('File upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { success: false, error: errorMessage, details: error },
      { status: 500 }
    );
  }
}

// Helper function to determine category from mime type
function getCategoryFromMimeType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'documents';
  if (mimeType.includes('document') || mimeType.includes('text')) return 'documents';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'documents';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'documents';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return 'archives';
  return 'others';
}
