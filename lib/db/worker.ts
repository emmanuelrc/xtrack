//lib/db/worker.ts
import { prisma } from "@/lib/db";
import type { Placement } from "@prisma/client";

export type WorkerBasics = {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string | null;
  department: string | null; // first associated dept (mobile header shows one line)
};

export type MonthlyPoint = { month: number; total_mSv: number };

export async function getWorkerById(id: number): Promise<WorkerBasics | null> {
  const w = await prisma.worker.findUnique({
    where: { id },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      Role: { select: { name: true } },
      Department: { select: { name: true } },
    },
  });
  if (!w) return null;

  return {
    id: w.id,
    firstName: w.first_name,
    lastName: w.last_name,
    fullName: `${w.first_name} ${w.last_name}`,
    role: w.Role[0]?.name ?? null,
    department: w.Department[0]?.name ?? null,
  };
}

export async function getWorkerYears(workerId: number): Promise<number[]> {
  const rows = await prisma.reading.findMany({
    where: {
      is_null: false,
      Dosimeter: { worker_id: workerId, is_control: false },
    },
    select: { reading_date: true },
    orderBy: { reading_date: "asc" },
  });

  const set = new Set<number>();
  for (const r of rows) set.add(r.reading_date.getUTCFullYear());
  return [...set].sort((a, b) => a - b);
}

/** Distinct dosimeter placements this worker has (e.g., CHEST, EYE, EXTREMITIES, FOETAL) */
export async function getWorkerPlacements(workerId: number): Promise<Placement[]> {
  const rows = await prisma.dosimeter.findMany({
    where: { worker_id: workerId, is_control: false, placement: { not: null } },
    select: { placement: true },
    distinct: ["placement"],
  });
  return rows.map(r => r.placement!).filter(Boolean);
}

/**
 * Monthly totals for a worker in a given year.
 * If `placement` is provided, only aggregate readings from dosimeters of that placement.
 */
export async function getWorkerMonthlyReadings(
  workerId: number,
  year: number,
  placement?: Placement
): Promise<MonthlyPoint[]> {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const readings = await prisma.reading.findMany({
    where: {
      reading_date: { gte: from, lt: to },
      is_null: false,
      Dosimeter: {
        worker_id: workerId,
        is_control: false,
        ...(placement ? { placement } : {}),
      },
    },
    select: {
      reading_date: true,
      total_mSv_chest: true,
      total_mSv_eye: true,
      total_mSv_extremities: true,
      total_mSv_foetal: true,
      Dosimeter: { select: { placement: true } },
    },
  });

  const buckets = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total_mSv: 0 }));

  for (const r of readings) {
    const m = r.reading_date.getUTCMonth(); // 0..11
    const p = r.Dosimeter?.placement;
    if (!p) continue;

    // pick correct field by placement
    const v =
      p === "CHEST"
        ? Number(r.total_mSv_chest ?? 0)
        : p === "EYE"
        ? Number(r.total_mSv_eye ?? 0)
        : p === "EXTREMITIES"
        ? Number(r.total_mSv_extremities ?? 0)
        : Number(r.total_mSv_foetal ?? 0);

    buckets[m].total_mSv += v;
  }

  return buckets;
}

export async function getWorkerMonthlyLimit(
  workerId: number,
  placement: Placement
): Promise<number | null> {
  // get worker’s primary dept & role (first entries)
  const w = await prisma.worker.findUnique({
    where: { id: workerId },
    select: {
      Department: { select: { id: true }, take: 1 },
      Role: { select: { id: true }, take: 1 },
    },
  });
  const deptId = w?.Department?.[0]?.id;
  const roleId = w?.Role?.[0]?.id;
  if (!deptId || !roleId) return null;

  const limit = await prisma.limit.findFirst({
    where: { department_id: deptId, role_id: roleId, placement },
    select: { limit_dose_mSv: true },
  });

  return limit ? Number(limit.limit_dose_mSv) : null;
}

/* -------------------------- NEW: exceedances helper -------------------------- */

export type Exceedance = {
  month: number;                 // 1..12
  placement: Placement;
  dose_mSv: number;
  limit_mSv: number;
  percent_over: number;          // e.g., 12.3 means 12.3% over the limit
};

export async function getWorkerMonthlyExceedances(
  workerId: number,
  year?: number,
  placement?: Placement
): Promise<Exceedance[]> {
  const placements = placement ? [placement] : await getWorkerPlacements(workerId);
  const y = year ?? new Date().getUTCFullYear();
  const results: Exceedance[] = [];

  for (const p of placements) {
    const [data, limit] = await Promise.all([
      getWorkerMonthlyReadings(workerId, y, p),
      getWorkerMonthlyLimit(workerId, p),
    ]);

    if (typeof limit !== "number") continue;

    for (const { month, total_mSv } of data) {
      const dose = Number(total_mSv ?? 0);
      if (dose > limit) {
        results.push({
          month,
          placement: p,
          dose_mSv: dose,
          limit_mSv: limit,
          percent_over: ((dose - limit) / limit) * 100,
        });
      }
    }
  }

  return results.sort((a, b) => (a.month - b.month) || a.placement.localeCompare(b.placement));
}
