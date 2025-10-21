import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Fetch all assets from Supabase
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch all assets from database
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { success: false, error: `Failed to fetch assets: ${error.message}` },
        { status: 500 }
      );
    }

    // Transform to frontend format and get public URLs
    const transformedAssets = assets.map((asset) => {
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(asset.filename);

      return {
        _id: asset.id,
        filename: asset.filename,
        originalName: asset.original_name,
        mimetype: asset.mime_type,
        size: asset.file_size,
        uploadDate: asset.upload_date,
        url: publicUrl,
        tags: asset.tags || [],
        category: asset.category,
      };
    });

    return NextResponse.json({ 
      success: true,
      assets: transformedAssets
    });
  } catch (error) {
    console.error('Assets GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// POST - Upload asset (not implemented yet)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Asset upload not yet migrated to Supabase' },
    { status: 501 }
  );
}

// DELETE - Delete assets from Supabase
export async function DELETE(request: NextRequest) {
  try {
    const { assetIds } = await request.json();
    
    if (!assetIds || !Array.isArray(assetIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assetIds' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get asset details first to get filenames
    const { data: assets, error: fetchError } = await supabase
      .from('assets')
      .select('id, filename')
      .in('id', assetIds);

    if (fetchError) {
      console.error('Failed to fetch assets for deletion:', fetchError);
      return NextResponse.json(
        { success: false, error: `Failed to fetch assets: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // Delete files from storage
    const filenames = assets.map(asset => asset.filename);
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .remove(filenames);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('assets')
      .delete()
      .in('id', assetIds);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json(
        { success: false, error: `Failed to delete assets: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${assetIds.length} asset(s)`,
    });
  } catch (error) {
    console.error('Assets DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete assets' },
      { status: 500 }
    );
  }
}
