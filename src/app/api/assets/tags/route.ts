import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Add tags to assets in Supabase
export async function POST(request: NextRequest) {
  try {
    const { assetIds, tags } = await request.json();1 

    if (!assetIds || !Array.isArray(assetIds) || !tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: assetIds and tags arrays required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update each asset with merged tags
    const updates = assetIds.map(async (assetId) => {
      // Get current tags
      const { data: asset } = await supabase
        .from('assets')
        .select('tags')
        .eq('id', assetId)
        .single();

      if (!asset) return { success: false, assetId };

      // Merge new tags with existing ones (avoid duplicates)
      const currentTags = asset.tags || [];
      const mergedTags = [...new Set([...currentTags, ...tags])];

      // Update asset
      const { error } = await supabase
        .from('assets')
        .update({ tags: mergedTags })
        .eq('id', assetId);

      return { success: !error, assetId };
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `Tags added to ${assetIds.length} asset(s)`
    });
  } catch (error) {
    console.error('Tags POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add tags' },
      { status: 500 }
    );
  }
}
