import { NextResponse } from "next/server";
import DocumentAnalysisModel from "@/models/documentAnalysis.model";
import mongoose from "mongoose";
import { requireAuth } from '@/lib/rbac';

export async function GET(req: Request) {
  try {
    // Require authentication to view analytics
    await requireAuth();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const companyId = searchParams.get("companyId");
    const limit = Number(searchParams.get("limit") || 5);

    if (!userId || !companyId) {
      return NextResponse.json({ message: "Missing userId or companyId" }, { status: 400 });
    }

    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [avgScoreAgg, topCompliances, totalAnalyzed, metricKeyCounts] = await Promise.all([
      DocumentAnalysisModel.aggregate([
        { $match: { companyId: companyObjectId, userId: userObjectId, score: { $ne: null } } },
        { $group: { _id: null, avgScore: { $avg: "$score" }, count: { $sum: 1 } } },
      ]),
      DocumentAnalysisModel.aggregate([
        { $match: { companyId: companyObjectId, userId: userObjectId, complianceStandard: { $exists: true, $ne: "" } } },
        { $group: { _id: "$complianceStandard", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]),
      DocumentAnalysisModel.countDocuments({ companyId: companyObjectId, userId: userObjectId }),
      DocumentAnalysisModel.aggregate([
        { $match: { companyId: companyObjectId, userId: userObjectId, metrics: { $type: "object" } } },
        { $project: { keys: { $objectToArray: "$metrics" } } },
        { $unwind: "$keys" },
        { $group: { _id: "$keys.k", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]),
    ]);

    return NextResponse.json({
      averageScore: avgScoreAgg?.[0]?.avgScore ?? null,
      analyzedCount: avgScoreAgg?.[0]?.count ?? 0,
      totalAnalyzed,
      topCompliances: topCompliances.map((r: any) => ({ name: r._id, count: r.count })),
      topMetricKeys: metricKeyCounts.map((r: any) => ({ key: r._id, count: r.count })),
    });
  } catch (e: any) {
    console.error("/api/analytics/compliance/summary error", e);
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}
