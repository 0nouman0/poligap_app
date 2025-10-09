import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, bucketName } from "@/lib/s3-config";
import { createApiResponse } from "@/lib/apiResponse";
import User from "@/models/users.model";
import mongoose from "mongoose";
import sharp from "sharp";
import { requireAuth } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();
    
    console.log('🚀 S3 Upload starting...');
    const startTime = Date.now();
    
    const formData = await request.formData();
    const type = formData.get("type") as string;
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;

    if (!type || !userId) {
      return createApiResponse({
        success: false,
        error: "Type and userId are required",
        status: 400,
      });
    }

    if (!file || !file.type.startsWith("image/")) {
      return createApiResponse({
        success: false,
        error: "Only image files are supported",
        status: 400,
      });
    }

    console.log(`📁 Processing file: ${file.name}, Size: ${file.size} bytes`);

    // Optimize image processing for better performance
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer)
      .resize(800, 800, { 
        fit: 'inside', 
        withoutEnlargement: true 
      }) // Resize for better performance
      .webp({ quality: 80, effort: 1 }) // Balanced quality and speed
      .toBuffer();

    console.log(`🖼️ Image optimized: ${buffer.length} → ${webpBuffer.length} bytes`);

    const fileName = `enterprise-search/${Date.now()}-${
      file.name.split(".")[0]
    }.webp`;

    // Upload to S3
    console.log('☁️ Uploading to S3...');
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: webpBuffer,
        ContentType: "image/webp",
        CacheControl: "max-age=31536000", // 1 year cache
      })
    );

    const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log(`✅ S3 upload complete: ${fileUrl}`);

    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // Update database with optimized query
    console.log('💾 Updating database...');
    let updateQuery: any = { updatedAt: new Date() };
    
    if (type === "banner") {
      updateQuery.banner = { image: fileUrl };
    } else if (type === "profileImage") {
      updateQuery.profileImage = fileUrl;
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: updateQuery },
      { 
        new: true, 
        upsert: true,
        select: 'profileImage banner updatedAt' // Only select needed fields
      }
    );

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Upload completed in ${totalTime}ms`);

    return createApiResponse({
      success: true,
      data: { 
        fileUrl,
        updatedUser: {
          profileImage: updatedUser?.profileImage,
          banner: updatedUser?.banner,
          updatedAt: updatedUser?.updatedAt
        }
      },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error uploading file:", error);
    return createApiResponse({
      success: false,
      error: "Failed to upload file",
      status: 500,
    });
  }
}
