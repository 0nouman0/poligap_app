import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// POST - Upload new asset
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Asset upload started');
    
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      try {
        console.log('🔄 Establishing database connection...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Database connection established');
      } catch (dbError) {
        console.error("❌ Database connection failed:", dbError);
        return NextResponse.json(
          { success: false, error: 'Database connection failed' },
          { status: 500 }
        );
      }
    }

    // Connect to MongoDB for assets collection
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
    } catch (dbError) {
      console.error("❌ MongoDB connection failed:", dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'others';
    const description = formData.get('description') as string || '';
    const tags = formData.get('tags') as string || '';
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    
    // File processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Try to save file to disk (may not work in serverless environments)
    let fileUrl = null;
    let localFileSaved = false;
    
    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = join(uploadDir, uniqueFilename);
      await writeFile(filePath, buffer);
      
      fileUrl = `/uploads/${uniqueFilename}`;
      localFileSaved = true;
      console.log('✅ File saved to local storage');
    } catch (fsError) {
      console.error('⚠️ Local file save failed (serverless environment?):', fsError);
      // In serverless environments, we'll store file data in database
      fileUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      console.log('📝 Using base64 data URL as fallback');
    }
    
    // Generate thumbnail for images (only if local file was saved successfully)
    let thumbnailUrl = null;
    if (file.type.startsWith('image/') && localFileSaved) {
      try {
        // Try to import Sharp dynamically
        const sharp = await import('sharp').then(m => m.default).catch(() => null);
        
        if (sharp) {
          const uploadDir = join(process.cwd(), 'public', 'uploads');
          const thumbnailFilename = `thumb_${uniqueFilename}`;
          const thumbnailPath = join(uploadDir, thumbnailFilename);
          
          await sharp(buffer)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
          
          thumbnailUrl = `/uploads/${thumbnailFilename}`;
          console.log('✅ Thumbnail generated successfully');
        } else {
          console.log('⚠️ Sharp not available, skipping thumbnail generation');
        }
      } catch (error) {
        console.error('⚠️ Error generating thumbnail (continuing without):', error);
      }
    }
    
    // Prepare asset document
    const assetDoc = {
      filename: uniqueFilename,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      uploadDate: new Date().toISOString(),
      category: category,
      description: description,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      url: fileUrl,
      thumbnailUrl: thumbnailUrl,
      localFileSaved: localFileSaved,
      storageType: localFileSaved ? 'local' : 'base64',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert into MongoDB
    let result;
    try {
      result = await db.collection('assets').insertOne(assetDoc);
      console.log('✅ Asset saved to database');
    } catch (dbError) {
      console.error('❌ Database insertion failed:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save asset to database' },
        { status: 500 }
      );
    }
    
    // Return the created asset
    const createdAsset = {
      ...assetDoc,
      _id: result.insertedId.toString()
    };
    
    console.log('✅ Asset upload completed successfully');
    return NextResponse.json({
      success: true,
      asset: createdAsset,
      message: 'Asset uploaded successfully',
      storageInfo: {
        type: localFileSaved ? 'local' : 'base64',
        hasThumbnail: !!thumbnailUrl
      }
    });
    
  } catch (error) {
    console.error('❌ Error uploading asset:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload asset',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
