// app/api/departments/worker-counts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


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
  const filters = parseFilters(req);

  try {
 
    const dosimeterWhere: any = {
      is_control: false,
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
        where: { id: { in: ids } },
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
      orderBy: { name: "asc" },
    });

    const data = wCounts.map((d) => ({ name: d.name, count: d._count.Worker }));
    return NextResponse.json({ success: true, data, source: "workers-fallback" });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
