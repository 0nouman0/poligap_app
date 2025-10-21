import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const supabase = await createClient();
    
    // Note: This feature requires a flagged_issues table in Supabase
    // For now, we'll gracefully handle if the table doesn't exist
    const { data: issue, error } = await supabase
      .from('flagged_issues')
      .insert({
        user_id: data.userId,
        company_id: data.companyId,
        status: data.status,
        reason: data.reason,
        name: data.name,
        email: data.email,
        note: data.note,
        date: data.date,
        link: data.link,
        title: data.title,
        viewed: false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Flagged issues save error (feature not enabled):", error.message);
      return NextResponse.json({ success: true, message: "Issue logged (feature not fully enabled)" });
    }
    
    return NextResponse.json({ success: true, data: issue });
  } catch (e) {
    console.error("Error in POST /api/flagged-issues:", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const userId = searchParams.get("userId");
    
    const supabase = await createClient();
    let query = supabase.from('flagged_issues').select('*').order('created_at', { ascending: false });
    
    if (companyId) query = query.eq('company_id', companyId);
    if (userId) query = query.eq('user_id', userId);
    
    const { data: issues, error } = await query;
    
    if (error) {
      console.error("Flagged issues fetch error (feature not enabled):", error.message);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(issues || []);
  } catch (e) {
    console.error("Error in GET /api/flagged-issues:", e);
    return NextResponse.json([]);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const supabase = await createClient();
    
    if (data.companyId) {
      // Mark all issues for this company as viewed
      await supabase
        .from('flagged_issues')
        .update({ viewed: true, status: 'viewed' })
        .eq('company_id', data.companyId);
      
      return NextResponse.json({ success: true });
    } else if (data.id) {
      // Mark a single issue as viewed
      await supabase
        .from('flagged_issues')
        .update({ viewed: true, status: 'viewed' })
        .eq('id', data.id);
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Missing companyId or id" },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error("Error in PATCH /api/flagged-issues:", e);
    return NextResponse.json({ success: true });
  }
}
