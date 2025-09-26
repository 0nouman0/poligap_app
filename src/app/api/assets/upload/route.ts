import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// POST - Upload new asset
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
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
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);
    
    // Generate thumbnail for images
    let thumbnailUrl = null;
    if (file.type.startsWith('image/')) {
      try {
        const thumbnailFilename = `thumb_${uniqueFilename}`;
        const thumbnailPath = join(uploadDir, thumbnailFilename);
        
        await sharp(buffer)
          .resize(300, 300, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
        
        thumbnailUrl = `/uploads/${thumbnailFilename}`;
      } catch (error) {
        console.error('Error generating thumbnail:', error);
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
      url: `/uploads/${uniqueFilename}`,
      thumbnailUrl: thumbnailUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert into MongoDB
    const result = await db.collection('assets').insertOne(assetDoc);
    
    // Return the created asset
    const createdAsset = {
      ...assetDoc,
      _id: result.insertedId.toString()
    };
    
    return NextResponse.json({
      success: true,
      asset: createdAsset,
      message: 'Asset uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}
