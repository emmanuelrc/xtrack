import { prisma } from "@/lib/db";
import type { Placement } from "@prisma/client";

type WorkerLastReading = {
  workerId: number;
  fullName: string;
  role: string | null;
  lastReadingDate: Date | null;
  lastReading_mSv: number | null;
};

type MonthlyBucket = { month: number; total_mSv: number };

type DepartmentAlert = {
  workerId: number;
  name: string;
  role: string | null;
  month: number;
  reading_mSv: number;
  limit_mSv: number;
};

const placementToField: Record<
  Placement,
  "total_mSv_chest" | "total_mSv_eye" | "total_mSv_extremities" | "total_mSv_foetal"
> = {
  CHEST: "total_mSv_chest",
  EYE: "total_mSv_eye",
  EXTREMITIES: "total_mSv_extremities",
  FOETAL: "total_mSv_foetal",
};

export async function getDepartmentById(id: number) {
  return prisma.department.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
}

export async function getDepartmentYears(deptId: number): Promise<number[]> {
  const rows = await prisma.reading.findMany({
    where: { Dosimeter: { department_id: deptId, is_control: false } },
    select: { reading_date: true },
    orderBy: { reading_date: "asc" },
  });
  const years = new Set<number>();
  for (const r of rows) years.add(r.reading_date.getUTCFullYear());
  return [...years].sort((a, b) => a - b);
}

export async function getDepartmentWorkersWithLastReading(
  deptId: number
): Promise<WorkerLastReading[]> {
  const workers = await prisma.worker.findMany({
    where: { Department: { some: { id: deptId } } },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      Role: { select: { name: true } },
      Dosimeter: {
        where: { department_id: deptId, is_control: false },
        select: {
          placement: true,
          Reading: {
            where: { is_null: false },
            orderBy: { reading_date: "desc" },
            take: 1,
            select: {
              reading_date: true,
              total_mSv_chest: true,
              total_mSv_eye: true,
              total_mSv_extremities: true,
              total_mSv_foetal: true,
            },
          },
        },
      },
    },
  });

  return workers.map((w) => {
    let latest: { reading_date: Date; value: number } | null = null;

    for (const d of w.Dosimeter) {
      const r = d.Reading[0];
      if (!r || d.placement == null) continue;
      const field = placementToField[d.placement];
      const value = Number(r[field] ?? 0);
      if (!latest || r.reading_date > latest.reading_date) {
        latest = { reading_date: r.reading_date, value };
      }
    }

    return {
      workerId: w.id,
      fullName: `${w.first_name} ${w.last_name}`,
      role: w.Role[0]?.name ?? null,
      lastReadingDate: latest?.reading_date ?? null,
      lastReading_mSv: latest ? Number(latest.value) : null,
    };
  });
}

export async function getDepartmentMonthlyReadings(
  deptId: number,
  year: number
): Promise<MonthlyBucket[]> {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await prisma.reading.findMany({
    where: {
      reading_date: { gte: from, lt: to },
      is_null: false,
      Dosimeter: { department_id: deptId, is_control: false },
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

  const buckets = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total_mSv: 0,
  }));

  for (const r of rows) {
    const m = r.reading_date.getUTCMonth(); // 0..11
    const p = r.Dosimeter?.placement;
    if (!p) continue;
    const field = placementToField[p];
    const v = Number((r as any)[field] ?? 0);
    buckets[m].total_mSv += v;
  }

  return buckets;
}

export async function getDepartmentAlerts(
  deptId: number,
  year: number
): Promise<DepartmentAlert[]> {
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const workers = await prisma.worker.findMany({
    where: { Department: { some: { id: deptId } } },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      Role: { select: { id: true, name: true } },
      Dosimeter: {
        where: { department_id: deptId, is_control: false },
        select: {
          placement: true,
          Reading: {
            where: { is_null: false, reading_date: { gte: from, lt: to } },
            select: {
              reading_date: true,
              total_mSv_chest: true,
              total_mSv_eye: true,
              total_mSv_extremities: true,
              total_mSv_foetal: true,
            },
          },
        },
      },
    },
  });

  const roleIds = workers.map((w) => w.Role[0]?.id).filter(Boolean) as number[];
  const limits = await prisma.limit.findMany({
    where: { department_id: deptId, role_id: { in: roleIds } },
    select: { role_id: true, limit_dose_mSv: true },
  });
  const limitByRoleId = new Map<number, number>();
  for (const l of limits) limitByRoleId.set(l.role_id, Number(l.limit_dose_mSv));

  const alerts: DepartmentAlert[] = [];

  for (const w of workers) {
    const role = w.Role[0] ?? null;
    const limit = role ? limitByRoleId.get(role.id) ?? null : null;
    if (limit == null) continue;

    const perMonth = new Array(12).fill(0) as number[];

    for (const d of w.Dosimeter) {
      const field = d.placement ? placementToField[d.placement] : null;
      if (!field) continue;
      for (const r of d.Reading) {
        const m = r.reading_date.getUTCMonth();
        const v = Number((r as any)[field] ?? 0);
        perMonth[m] += v;
      }
    }

    perMonth.forEach((val, idx) => {
      if (val > limit) {
        alerts.push({
          workerId: w.id,
          name: `${w.first_name} ${w.last_name}`,
          role: role?.name ?? null,
          month: idx + 1,
          reading_mSv: Number(val),
          limit_mSv: Number(limit),
        });
      }
    });
  }

  alerts.sort((a, b) => b.month - a.month || b.reading_mSv - a.reading_mSv);
  return alerts;
}
