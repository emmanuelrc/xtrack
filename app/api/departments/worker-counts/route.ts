// app/api/departments/worker-counts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requirePermission, getAllowedDepartmentIds } from "@/lib/auth";


type FilterParams = {
  orgId?: string | null; 
  siteId?: string | null; 
  from?: string | null; 
  to?: string | null;   
};

function parseFilters(req: NextRequest): FilterParams {
  const u = new URL(req.url);
  const q = u.searchParams;
  return {
    orgId: q.get("orgId"),
    siteId: q.get("siteId"),
    from: q.get("from"),
    to: q.get("to"),
  };
}

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const ok = await requirePermission(user, 'DEPARTMENT');
  if (!ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const filters = parseFilters(req);

  try {
    const allowedDeptIds = getAllowedDepartmentIds(user);
    if (Array.isArray(allowedDeptIds) && allowedDeptIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const dosimeterWhere: any = {
      is_control: false,
      ...(allowedDeptIds === null ? {} : { department_id: { in: allowedDeptIds } }),
    };
    if (filters.from || filters.to) {
      dosimeterWhere.createdAt = {};
      if (filters.from) dosimeterWhere.createdAt.gte = new Date(filters.from);
      if (filters.to) dosimeterWhere.createdAt.lte = new Date(filters.to);
    }

    const dGroup = await prisma.dosimeter.groupBy({
      by: ["department_id"], // <-- matches schema.prisma
      _count: { id: true },
      where: Object.keys(dosimeterWhere).length ? dosimeterWhere : undefined,
    });

    if (dGroup.length) {
      const ids = dGroup.map((r) => r.department_id);
      const depts = await prisma.department.findMany({
        where:
          allowedDeptIds === null
            ? { id: { in: ids } }
            : { id: { in: ids.filter((id) => allowedDeptIds.includes(id)) } },
        select: { id: true, name: true },
      });
      const nameById = new Map(depts.map((d) => [d.id, d.name]));

      const data = dGroup
        .map((r) => ({
          name: nameById.get(r.department_id) ?? String(r.department_id),
          count: r._count.id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return NextResponse.json({ success: true, data, source: "dosimeters" });
    }


    const wCounts = await prisma.department.findMany({
      select: {
        name: true,
        _count: { select: { Worker: true } },
      },
      where: allowedDeptIds === null ? undefined : { id: { in: allowedDeptIds } },
      orderBy: { name: "asc" },
    });

    const data = wCounts.map((d) => ({ name: d.name, count: d._count.Worker }));
    return NextResponse.json({ success: true, data, source: "workers-fallback" });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
