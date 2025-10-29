import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to force refresh members cache
 * This can be called after role changes to ensure UI updates
 */
export async function POST(request: NextRequest) {
  // This endpoint just returns success - the client should invalidate its cache
  return NextResponse.json({
    success: true,
    message: "Please refresh your browser or invalidate React Query cache",
  });
}

