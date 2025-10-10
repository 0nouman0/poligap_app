import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiResponse } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const customPath = formData.get("path") as string;

    if (!file) {
      return createApiResponse({
        success: false,
        error: "File is required",
        status: 400,
      });
    }

    const supabase = await createClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop() || "";
    const fileName = `${customPath || "uploads"}/${Date.now()}-${file.name}`;

    // Set appropriate content type based on file extension
    const contentType = file.type || "application/octet-stream";

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType: contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return createApiResponse({
        success: false,
        error: `Upload failed: ${uploadError.message}`,
        status: 500,
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    return createApiResponse({
      success: true,
      data: {
        fileUrl: publicUrl,
        fileName,
        contentType,
        size: buffer.length,
        fileExtension,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return createApiResponse({
      success: false,
      error: "Failed to upload file",
      status: 500,
    });
  }
}
