import { NextResponse } from "next/server";
import SearchHistoryModel from "@/models/searchHistory.model";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const companyId = searchParams.get("companyId");
    const days = Number(searchParams.get("days") || 30);

    if (!userId || !companyId) {
      return NextResponse.json({ message: "Missing userId or companyId" }, { status: 400 });
    }

    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const results = await SearchHistoryModel.aggregate([
      {
        $match: {
          companyId: (companyId as any),
          enterpriseUserId: (userId as any),
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
            d: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: { $size: "$text" } },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
    ]);

    // Normalize to all days
    const series: { date: string; count: number }[] = [];
    const map = new Map<string, number>();
    for (const r of results) {
      const key = `${r._id.y}-${String(r._id.m).padStart(2, "0")}-${String(r._id.d).padStart(2, "0")}`;
      map.set(key, r.count);
    }

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      series.push({ date: key, count: map.get(key) || 0 });
    }

    return NextResponse.json({ series });
  } catch (e: any) {
    console.error("/api/analytics/searches/series error", e);
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}
