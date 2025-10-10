import { NextRequest, NextResponse } from 'next/server';

// TODO: Migrate to Supabase media table
// GET - Fetch all assets
export async function GET(request: NextRequest) {
  try {
    // Return empty array for now - to be migrated to Supabase media table
    return NextResponse.json({ 
      success: true,
      assets: []
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

// DELETE - Delete assets (not implemented yet)
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Asset deletion not yet migrated to Supabase' },
    { status: 501 }
  );
}
