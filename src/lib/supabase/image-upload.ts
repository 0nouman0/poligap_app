import { createClient } from '@/lib/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
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
 * Complete image upload flow: upload to storage + update database
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
    
    return { success: true, url: uploadResult.url };
  } catch (error) {
    console.error(`${type} upload error:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}
