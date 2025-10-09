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
