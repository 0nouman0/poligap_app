import { NextResponse } from "next/server";
import SearchHistoryModel from "@/models/searchHistory.model";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const companyId = searchParams.get("companyId");
    const limit = Number(searchParams.get("limit") || 5);

    if (!userId || !companyId) {
      return NextResponse.json({ message: "Missing userId or companyId" }, { status: 400 });
    }

    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Flatten text[].title and count
    const results = await SearchHistoryModel.aggregate([
      { $match: { companyId: companyObjectId, enterpriseUserId: userObjectId } },
      { $unwind: { path: "$text", preserveNullAndEmptyArrays: false } },
      { $match: { "text.title": { $exists: true, $ne: "" } } },
      { $group: { _id: "$text.title", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    return NextResponse.json({ items: results.map((r: any) => ({ title: r._id, count: r.count })) });
  } catch (e: any) {
    console.error("/api/analytics/searches/top error", e);
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}
