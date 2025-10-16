import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Returns recent uploads from the 'assets' table
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('upload_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('uploads/recent error:', error);
      return NextResponse.json([]);
    }

    const activities = (data || []).map((row: any) => ({
      id: row.id,
      type: 'upload',
      title: row.original_name || row.filename || 'File Upload',
      description: row.category || 'File uploaded',
      status: 'completed',
      timestamp: row.upload_date,
      fileName: row.original_name || row.filename
    }));

    return NextResponse.json(activities);
  } catch (e) {
    console.error('uploads/recent unexpected error:', e);
    return NextResponse.json([]);
  }
}
