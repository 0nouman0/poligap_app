import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Basic text extraction - for now just return file info
    const text = await file.text();
    
    return NextResponse.json({
      success: true,
      text: text || 'No text content found',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  } catch (error) {
    console.error('Extract basic error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from file' },
      { status: 500 }
    );
  }
}