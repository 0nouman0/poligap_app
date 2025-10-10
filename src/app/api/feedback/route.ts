import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiResponse } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const { satisfaction, text, userId, companyId } = await request.json();
    if (!satisfaction || !userId) {
      return createApiResponse({
        success: false,
        error: "Satisfaction and userId are required",
        status: 400,
      });
    }
    
    const supabase = await createClient();
    
    // Insert feedback into Supabase (assuming we have a feedback table)
    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert({
        satisfaction,
        feedback_text: text,
        user_id: userId,
        company_id: companyId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      // If table doesn't exist, just log it (non-critical feature)
      console.error("Feedback save error (non-critical):", error.message);
      return createApiResponse({
        success: true,
        data: { message: "Feedback received (logging system unavailable)" },
        status: 201,
      });
    }
    
    return createApiResponse({
      success: true,
      data: feedback,
      status: 201,
    });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    });
  }
}
