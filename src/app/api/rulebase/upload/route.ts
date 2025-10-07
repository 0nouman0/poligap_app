import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import RulebaseModel from '@/models/rulebase.model';

// Ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    try {
      console.log('🔄 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI as string);
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw new Error('Database connection failed');
    }
  }
}

export async function POST(req: Request) {
  try {
    console.log('🚀 POST /api/rulebase/upload - Starting request');
    await ensureDbConnection();
    
    const form = await req.formData();
    const file = form.get('file') as File | null;
    
    if (!file) {
      console.log('❌ Upload error: No file provided');
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    console.log('📁 File received:', file.name, 'Size:', file.size);

    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer).toString('utf-8');
    
    // Create new rule in MongoDB with file content
    const newRule = new RulebaseModel({
      name: file.name,
      description: `Uploaded rule file (${(arrayBuffer.byteLength/1024).toFixed(1)} KB)`,
      tags: ['uploaded'],
      sourceType: 'file',
      fileName: file.name,
      fileContent: fileContent.substring(0, 10000), // Limit content size
      active: true,
    });
    
    const savedRule = await newRule.save();
    console.log('✅ Uploaded rule created:', savedRule._id);
    
    // Transform for frontend
    const rule = {
      _id: savedRule._id.toString(),
      name: savedRule.name,
      description: savedRule.description || '',
      tags: savedRule.tags || [],
      sourceType: savedRule.sourceType,
      fileName: savedRule.fileName,
      active: savedRule.active,
      updatedAt: savedRule.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ rule });
  } catch (e) {
    console.error('❌ Upload error:', e);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 });
  }
}
