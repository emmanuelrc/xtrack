// lib/db/alerts.ts

import { prisma } from "@/lib/db";
import { Placement, Reading } from "@prisma/client";

/**
 * Returns the most recent exceedance events across the organisation.
 * We check CHEST and EYE totals against the lowest applicable limit
 * for each worker's role(s) in the dosimeter's department.
 */
export async function getRecentExceedances(limit = 3, allowedDeptIds: number[] | null = null) {
  if (Array.isArray(allowedDeptIds) && allowedDeptIds.length === 0) {
    return [];
  }
  // Pull a chunk of recent readings to evaluate. Tweak as needed.
  const recentReadings = await prisma.reading.findMany({
    where:
      allowedDeptIds === null
        ? undefined
        : {
            Dosimeter: {
              is: { department_id: { in: allowedDeptIds } },
            },
          },
    orderBy: { reading_date: "desc" },
    take: 200,
    include: {
      Dosimeter: {
        select: {
          id: true,
          department_id: true,
          Worker: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              Role: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  // Preload all limits used by these (dept, role, placement) combos
  const deptIds = Array.from(
    new Set(recentReadings.map(r => r.Dosimeter.department_id))
  );
  const roleIds = Array.from(
    new Set(
      recentReadings.flatMap(r => r.Dosimeter.Worker?.Role?.map(rr => rr.id) ?? [])
    )
  );

  const limits = await prisma.limit.findMany({
    where: {
      department_id: { in: deptIds.length ? deptIds : [0] },
      role_id: { in: roleIds.length ? roleIds : [0] },
      placement: { in: [Placement.CHEST, Placement.EYE] },
    },
    select: {
      department_id: true,
      role_id: true,
      placement: true,
      limit_dose_mSv: true,
    },
  });

  // Build a quick lookup: dept -> placement -> roleId -> limit
  const limitByDeptPlacementRole = new Map<
    number,
    Map<Placement, Map<number, number>>
  >();
  for (const l of limits) {
    const deptMap =
      limitByDeptPlacementRole.get(l.department_id) ??
      limitByDeptPlacementRole.set(l.department_id, new Map()).get(l.department_id)!;
    const placeMap =
      deptMap.get(l.placement) ?? deptMap.set(l.placement, new Map()).get(l.placement)!;
    placeMap.set(Number(l.role_id), Number(l.limit_dose_mSv));
  }

  type Ex = {
    readingDate: Date;
    month: number;
    placement: Placement;
    workerId: number;
    name: string;
    role: string | null;
    dose_mSv: number;
    limit_mSv: number;
    percent_over: number;
  };

  const out: Ex[] = [];

  function evalOne(reading: Reading, placement: Placement) {
    const dose =
      placement === Placement.CHEST
        ? Number(reading.total_mSv_chest)
        : Number(reading.total_mSv_eye);

    // Controls and missing workers are skipped
    const worker = reading.Dosimeter.Worker;
    if (!worker) return;

    const deptId = reading.Dosimeter.department_id;

    // Collect all role-based limits for this department+placement and pick the lowest
    const deptMap = limitByDeptPlacementRole.get(deptId);
    const placeMap = deptMap?.get(placement);
    if (!placeMap) return;

    const workerRoleIds = worker.Role?.map(r => r.id) ?? [];
    const applicable = workerRoleIds
      .map(id => placeMap.get(id))
      .filter((v): v is number => typeof v === "number");

    if (applicable.length === 0) return;

    const limit = Math.min(...applicable);
    if (limit <= 0) return;

    if (dose > limit) {
      const month = new Date(reading.reading_date).getUTCMonth() + 1;
      const percent_over = ((dose - limit) / limit) * 100;
      out.push({
        readingDate: reading.reading_date,
        month,
        placement,
        workerId: worker.id,
        name: `${worker.first_name} ${worker.last_name}`,
        role: worker.Role?.[0]?.name ?? null,
        dose_mSv: dose,
        limit_mSv: limit,
        percent_over,
      });
    }
  }

  // Check CHEST and EYE for each reading
  for (const r of recentReadings) {
    evalOne(r as any, Placement.CHEST);
    evalOne(r as any, Placement.EYE);
  }

  // Sort newest first and take the requested limit
  out.sort((a, b) => b.readingDate.getTime() - a.readingDate.getTime());
  return out.slice(0, limit);
}

/**
 * Full list, optionally filtered by year.
 */
export async function getAllExceedances(
  params?: { year?: number },
  allowedDeptIds: number[] | null = null
) {
  const year = params?.year;

  if (Array.isArray(allowedDeptIds) && allowedDeptIds.length === 0) {
    return [] as Awaited<ReturnType<typeof getRecentExceedances>>;
  }

  const dateWhere =
    typeof year === "number"
      ? {
          reading_date: {
            gte: new Date(Date.UTC(year, 0, 1)),
            lt: new Date(Date.UTC(year + 1, 0, 1)),
          },
        }
      : {};

  const where = {
    ...dateWhere,
    ...(allowedDeptIds === null
      ? {}
      : {
          Dosimeter: {
            is: { department_id: { in: allowedDeptIds } },
          },
        }),
  } as any;

  const readings = await prisma.reading.findMany({
    where,
    orderBy: { reading_date: "desc" },
    include: {
      Dosimeter: {
        select: {
          department_id: true,
          Worker: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              Role: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  // Reuse the same limit preload as above
  const deptIds = Array.from(new Set(readings.map(r => r.Dosimeter.department_id)));
  const roleIds = Array.from(
    new Set(readings.flatMap(r => r.Dosimeter.Worker?.Role?.map(rr => rr.id) ?? []))
  );

  const limits = await prisma.limit.findMany({
    where: {
      department_id: { in: deptIds.length ? deptIds : [0] },
      role_id: { in: roleIds.length ? roleIds : [0] },
      placement: { in: [Placement.CHEST, Placement.EYE] },
    },
    select: {
      department_id: true,
      role_id: true,
      placement: true,
      limit_dose_mSv: true,
    },
  });

  const limitByDeptPlacementRole = new Map<
    number,
    Map<Placement, Map<number, number>>
  >();
  for (const l of limits) {
    const deptMap =
      limitByDeptPlacementRole.get(l.department_id) ??
      limitByDeptPlacementRole.set(l.department_id, new Map()).get(l.department_id)!;
    const placeMap =
      deptMap.get(l.placement) ?? deptMap.set(l.placement, new Map()).get(l.placement)!;
    placeMap.set(Number(l.role_id), Number(l.limit_dose_mSv));
  }

  const out: Awaited<ReturnType<typeof getRecentExceedances>> = [];

  function evalOne(reading: any, placement: Placement) {
    const dose =
      placement === Placement.CHEST
        ? Number(reading.total_mSv_chest)
        : Number(reading.total_mSv_eye);

    const worker = reading.Dosimeter.Worker;
    if (!worker) return;

    const deptId = reading.Dosimeter.department_id;
    const deptMap = limitByDeptPlacementRole.get(deptId);
    const placeMap = deptMap?.get(placement);
    if (!placeMap) return;

    const workerRoleIds = worker.Role?.map((r: any) => r.id) ?? [];
    const applicable = workerRoleIds
      .map((id: number) => placeMap.get(id))
      .filter((v: any): v is number => typeof v === "number");
    if (applicable.length === 0) return;

    const limit = Math.min(...applicable);
    if (limit <= 0) return;

    if (dose > limit) {
      const month = new Date(reading.reading_date).getUTCMonth() + 1;
      const percent_over = ((dose - limit) / limit) * 100;
      out.push({
        readingDate: reading.reading_date,
        month,
        placement,
        workerId: worker.id,
        name: `${worker.first_name} ${worker.last_name}`,
        role: worker.Role?.[0]?.name ?? null,
        dose_mSv: dose,
        limit_mSv: limit,
        percent_over,
      });
    }
  }

  for (const r of readings) {
    evalOne(r, Placement.CHEST);
    evalOne(r, Placement.EYE);
  }

  out.sort((a, b) => b.readingDate.getTime() - a.readingDate.getTime());
  return out;
}
