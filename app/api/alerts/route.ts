// app/api/alerts/route.ts


import { NextRequest } from "next/server";
import { getRecentExceedances, getAllExceedances } from "@/lib/db/alerts";
import { requireAuth, getAllowedDepartmentIds } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return Response.json({ success: false, error: "unauthorized" }, { status: 401 });

  const allowedDeptIds = getAllowedDepartmentIds(user);

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const yearParam = searchParams.get("year");

  if (limitParam) {
    const limit = Math.max(1, Math.min(50, Number(limitParam) || 3));
    const data = await getRecentExceedances(limit, allowedDeptIds);
    return Response.json({ success: true, data });
  }

  const year = yearParam ? Number(yearParam) : undefined;
  const data = await getAllExceedances({ year: Number.isFinite(year) ? year : undefined }, allowedDeptIds);
  return Response.json({ success: true, data });
}
