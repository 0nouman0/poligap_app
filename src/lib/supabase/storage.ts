import { createClient } from "@/lib/supabase/client";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (e.g., 'avatars', 'banners')
 * @param userId - The user ID for organizing files
 * @param folder - Optional folder path within the bucket
 */
export async function uploadToSupabase(
  file: File,
  bucket: string,
  userId: string,
  folder?: string
): Promise<UploadResult> {
  try {
    console.log('🚀 Starting Supabase upload:', { bucket, userId, fileName: file.name });
    const supabase = createClient();

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log('📁 Upload path:', filePath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message
      };
    }

    console.log('✅ Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error('❌ Failed to get public URL');
      return {
        success: false,
        error: 'Failed to get public URL'
      };
    }

    console.log('🔗 Public URL:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('❌ Upload to Supabase failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param filePath - The path to the file in the bucket
 */
export async function deleteFromSupabase(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete from Supabase failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update profile image in Supabase profiles table
 */
export async function updateProfileImageInDB(
  userId: string,
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Updating profile image in DB:', { userId, imageUrl });
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ profile_image: imageUrl })
      .eq('id', userId);

    if (error) {
      console.error('❌ Profile image update error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Profile image updated in DB successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Update profile image failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update banner image in Supabase profiles table
 */
export async function updateBannerInDB(
  userId: string,
  bannerUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Updating banner in DB:', { userId, bannerUrl });
    const supabase = createClient();

    // First get current banner data to preserve existing properties
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('banner')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching current profile:', fetchError);
    }

    // Update banner with new image while preserving other properties
    const { error } = await supabase
      .from('profiles')
      .update({ 
        banner: {
          ...(currentProfile?.banner || {}),
          image: bannerUrl,
          type: currentProfile?.banner?.type || 'image',
          color: currentProfile?.banner?.color || '#FFFFFF',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Banner update error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Banner updated in DB successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Update banner failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
