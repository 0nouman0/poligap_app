import { NextRequest, NextResponse } from 'next/server';

// TODO: Migrate to Supabase media table
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Tags API not yet migrated to Supabase' },
    { status: 501 }
  );
}
