import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: false, error: "Knowledge-base not yet migrated to Supabase" }, { status: 501 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: false, error: "Knowledge-base not yet migrated to Supabase" }, { status: 501 });
}
