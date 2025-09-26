import { NextResponse } from "next/server";
import SearchHistoryModel from "@/models/searchHistory.model";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const companyId = searchParams.get("companyId");
    const limit = Number(searchParams.get("limit") || 5);

    if (!userId || !companyId) {
      return NextResponse.json({ message: "Missing userId or companyId" }, { status: 400 });
    }

    // Flatten text[].title and count
    const results = await SearchHistoryModel.aggregate([
      { $match: { companyId: (companyId as any), enterpriseUserId: (userId as any) } },
      { $unwind: { path: "$text", preserveNullAndEmptyArrays: false } },
      { $match: { "text.title": { $exists: true, $ne: "" } } },
      { $group: { _id: "$text.title", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return NextResponse.json({ items: results.map(r => ({ title: r._id, count: r.count })) });
  } catch (e: any) {
    console.error("/api/analytics/searches/top error", e);
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}
