// lib/db/stats.ts


import { prisma } from "@/lib/db";
import { Placement } from "@prisma/client";

export type DeptBasic = { id: number; name: string };
export type MonthPoint = {
  y: number; m: number;
  chestMean: number; eyeMean: number;
  chestExceeds: boolean;  // any worker exceeded in month (CHEST)
  eyeExceeds: boolean;    // any worker exceeded in month (EYE)
};

export async function getDepartmentsBasic(): Promise<DeptBasic[]> {
  return prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Smallest defined limit per placement for a department (conservative). */
export async function getDepartmentLimits(departmentId: number): Promise<{ CHEST?: number; EYE?: number }> {
  const limits = await prisma.limit.findMany({
    where: { department_id: departmentId, placement: { in: [Placement.CHEST, Placement.EYE] } },
    select: { placement: true, limit_dose_mSv: true },
  });

  const out: { CHEST?: number; EYE?: number } = {};
  for (const p of [Placement.CHEST, Placement.EYE]) {
    const vals = limits.filter(l => l.placement === p).map(l => Number(l.limit_dose_mSv));
    if (vals.length) out[p] = Math.min(...vals);
  }
  return out;
}


export async function getDepartmentMonthlyMeansLast6(departmentId: number, monthsBack = 6) {
  const now = new Date();
  let end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  let start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (monthsBack - 1), 1));

 
  const recentCount = await prisma.reading.count({
    where: {
      is_null: false,
      reading_date: { gte: start, lt: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 1)) },
      Dosimeter: { department_id: departmentId, is_control: false },
    },
  });
  if (recentCount === 0) {
    const latest = await prisma.reading.findFirst({
      where: { is_null: false, Dosimeter: { department_id: departmentId, is_control: false } },
      orderBy: { reading_date: "desc" },
      select: { reading_date: true },
    });
    if (latest) {
      end = new Date(Date.UTC(latest.reading_date.getUTCFullYear(), latest.reading_date.getUTCMonth(), 1));
      start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (monthsBack - 1), 1));
    }
  }

  const readings = await prisma.reading.findMany({
    where: {
      is_null: false,
      reading_date: { gte: start, lt: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 1)) },
      Dosimeter: { department_id: departmentId, is_control: false },
    },
    select: {
      reading_date: true,
      total_mSv_chest: true,
      total_mSv_eye: true,
      Dosimeter: { select: { Worker: { select: { id: true } } } },
    },
    orderBy: { reading_date: "asc" },
  });

 
  const buckets: MonthPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    buckets.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, chestMean: 0, eyeMean: 0, chestExceeds: false, eyeExceeds: false });
  }
  const key = (y: number, m: number) => `${y}-${m}`;
  const monthKeySet = new Set(buckets.map(b => key(b.y, b.m)));

  // Sum per (month, worker)
  const perWorker = new Map<string, { chest: number; eye: number }>(); // key: "y-m:workerId"
  for (const r of readings) {
    const y = r.reading_date.getUTCFullYear();
    const m = r.reading_date.getUTCMonth() + 1;
    const monKey = key(y, m);
    if (!monthKeySet.has(monKey)) continue;

    const workerId = r.Dosimeter.Worker?.id;
    if (!workerId) continue;

    const wkKey = `${monKey}:${workerId}`;
    const acc = perWorker.get(wkKey) ?? { chest: 0, eye: 0 };
    acc.chest += Number(r.total_mSv_chest ?? 0);
    acc.eye   += Number(r.total_mSv_eye ?? 0);
    perWorker.set(wkKey, acc);
  }

  // Group by month → lists of worker totals
  const byMonthWorkers = new Map<string, { chestVals: number[]; eyeVals: number[] }>();
  for (const [wkKey, v] of perWorker) {
    const [monKey] = wkKey.split(":");
    const bag = byMonthWorkers.get(monKey) ?? { chestVals: [], eyeVals: [] };
    bag.chestVals.push(v.chest);
    bag.eyeVals.push(v.eye);
    byMonthWorkers.set(monKey, bag);
  }

  const limits = await getDepartmentLimits(departmentId);
  const mean = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

  for (const b of buckets) {
    const monKey = key(b.y, b.m);
    const bag = byMonthWorkers.get(monKey);

    const chestVals = bag?.chestVals ?? [];
    const eyeVals   = bag?.eyeVals ?? [];

    b.chestMean = mean(chestVals);
    b.eyeMean   = mean(eyeVals);

  
    b.chestExceeds = limits.CHEST != null ? chestVals.some(v => v > limits.CHEST!) : false;
    b.eyeExceeds   = limits.EYE   != null ? eyeVals.some(v => v > limits.EYE!)   : false;
  }

  const monthName = (m: number) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1];
  const first = buckets[0], last = buckets[buckets.length - 1];
  const sameYear = first.y === last.y;
  const rangeLabel = sameYear
    ? `${monthName(first.m)} – ${monthName(last.m)} ${last.y}`
    : `${monthName(first.m)} ${first.y} – ${monthName(last.m)} ${last.y}`;

  return { points: buckets, rangeLabel };
}
