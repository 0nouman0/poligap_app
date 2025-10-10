import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'profileImage' or 'banner'
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify user can only upload their own files
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - can only upload your own files' },
        { status: 403 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}/${type}_${timestamp}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    // Update user profile with new image URL
    const updateData: any = {};
    
    if (type === 'profileImage') {
      updateData.profile_image = publicUrl;
    } else if (type === 'banner') {
      // Get current banner data and update only the image
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('banner')
        .eq('id', userId)
        .single();
      
      updateData.banner = {
        ...(currentProfile?.banner || {}),
        image: publicUrl,
      };
    }

    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Still return success for upload, but log the error
      console.warn('Image uploaded but profile update failed:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: publicUrl,
        fileName: fileName,
        type: type,
      },
      message: `${type === 'profileImage' ? 'Profile picture' : 'Banner'} uploaded successfully`,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
