import { NextResponse } from 'next/server';

// Import the same in-memory storage from the main route
// In production, this should use a shared database
let rulesStore: { rules: any[] } = { rules: [] };

async function readRules() {
  return rulesStore;
}

async function writeRules(data: any) {
  rulesStore = data;
}

export async function POST(req: Request) {
  try {
    console.log('POST /api/rulebase/upload - Starting request');
    
    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      console.log('Upload error: No file provided');
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    console.log('File received:', file.name, 'Size:', file.size);

    const arrayBuffer = await file.arrayBuffer();
    // We don't persist file content to disk for now; just register metadata
    const data = await readRules();
    const rule = {
      _id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      name: file.name,
      description: `Uploaded rule file (${(arrayBuffer.byteLength/1024).toFixed(1)} KB)`,
      tags: ['uploaded'],
      sourceType: 'file' as const,
      fileName: file.name,
      active: true,
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Creating uploaded rule:', rule);
    
    data.rules = [rule, ...(data.rules || [])];
    await writeRules(data);
    
    console.log('Upload success');
    return NextResponse.json({ rule });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}
