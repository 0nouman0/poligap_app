import { NextResponse } from "next/server";
import AuditLogModel from "@/models/auditLog.model";
import FlaggedIssueModel from "@/models/flaggedIssue.model";
import SearchHistoryModel from "@/models/searchHistory.model";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const companyId = searchParams.get("companyId");

    if (!userId || !companyId) {
      return NextResponse.json(
        { message: "Missing userId or companyId" },
        { status: 400 }
      );
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [searchCountMonth, flaggedByStatus, auditCountMonth] = await Promise.all([
      SearchHistoryModel.countDocuments({
        companyId,
        enterpriseUserId: userId,
        createdAt: { $gte: monthStart },
      }),
      FlaggedIssueModel.aggregate([
        { $match: { companyId: (companyId as any) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      AuditLogModel.countDocuments({
        companyId,
        userId,
        createdAt: { $gte: monthStart },
      }),
    ]);

    const flagged = flaggedByStatus.reduce((acc: Record<string, number>, cur: any) => {
      acc[cur._id || "unknown"] = cur.count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      period: "month_to_date",
      searchCountMonth,
      auditCountMonth,
      flagged,
    });
  } catch (e: any) {
    console.error("/api/analytics/usage error", e);
    return NextResponse.json({ message: e?.message || "Server error" }, { status: 500 });
  }
}
