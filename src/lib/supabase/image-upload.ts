import { createClient } from '@/lib/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Delete old images for a user from a specific bucket
 */
export async function deleteOldImages(
  bucket: 'banners' | 'avatars',
  userId: string,
  keepLatest: number = 1
): Promise<void> {
  try {
    const supabase = createClient();
    
    // Get all images for this user in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return;
    }

    // Filter files for this user and sort by creation date (newest first)
    const userFiles = files
      .filter(file => file.name.startsWith(`${userId}_`))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Keep only the latest files, delete the rest
    const filesToDelete = userFiles.slice(keepLatest);
    
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Deleting ${filesToDelete.length} old ${bucket} images for user ${userId}`);
      
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove(filesToDelete.map(file => file.name));

      if (deleteError) {
        console.error('Error deleting old files:', deleteError);
      } else {
        console.log(`✅ Successfully deleted ${filesToDelete.length} old ${bucket} images`);
      }
    }
  } catch (error) {
    console.error('Error in deleteOldImages:', error);
  }
}

/**
 * Upload image to Supabase Storage and return public URL
 */
export async function uploadImageToStorage(
  file: File,
  bucket: 'banners' | 'avatars',
  userId: string
): Promise<UploadResult> {
  try {
    const supabase = createClient();
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Update profile image in database using Supabase MCP
 */
export async function updateProfileImage(
  userId: string,
  imageUrl: string
): Promise<UploadResult> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        profile_image: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Profile image update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Profile image update error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database update failed' 
    };
  }
}

/**
 * Update banner image in database using Supabase MCP
 */
export async function updateBannerImage(
  userId: string,
  imageUrl: string
): Promise<UploadResult> {
  try {
    const supabase = createClient();
    
    // First get current banner data to preserve existing properties
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('banner')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current profile:', fetchError);
    }

    // Update banner with new image while preserving other properties
    const { error } = await supabase
      .from('profiles')
      .update({ 
        banner: {
          ...(currentProfile?.banner || {}),
          image: imageUrl,
          type: currentProfile?.banner?.type || 'image',
          color: currentProfile?.banner?.color || '#FFFFFF',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Banner update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Banner update error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database update failed' 
    };
  }
}

/**
 * Complete image upload flow: upload to storage + update database + delete old images
 */
export async function uploadAndUpdateImage(
  file: File,
  type: 'banner' | 'profileImage',
  userId: string
): Promise<UploadResult> {
  try {
    const bucket = type === 'banner' ? 'banners' : 'avatars';
    
    // Step 1: Upload to storage
    console.log(`📤 Uploading ${type} to storage...`);
    const uploadResult = await uploadImageToStorage(file, bucket, userId);
    
    if (!uploadResult.success || !uploadResult.url) {
      return uploadResult;
    }
    
    console.log(`✅ ${type} uploaded to storage:`, uploadResult.url);
    
    // Step 2: Update database
    console.log(`💾 Updating ${type} in database...`);
    const dbResult = type === 'banner' 
      ? await updateBannerImage(userId, uploadResult.url)
      : await updateProfileImage(userId, uploadResult.url);
    
    if (!dbResult.success) {
      return dbResult;
    }
    
    console.log(`✅ ${type} updated in database successfully`);
    
    // Step 3: Delete old images (keep only the latest 1)
    console.log(`🗑️ Cleaning up old ${type} images...`);
    await deleteOldImages(bucket, userId, 1);
    
    return { success: true, url: uploadResult.url };
  } catch (error) {
    console.error(`${type} upload error:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}
