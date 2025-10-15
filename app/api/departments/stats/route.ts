// app/api/departments/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Placement } from "@prisma/client";
import { requireAuth, requirePermission, getAllowedDepartmentIds } from "@/lib/auth";

function ymKey(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
}
function parseYM(s: string | null) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  if (Number.isNaN(y) || mo < 0 || mo > 11) return null;
  return new Date(Date.UTC(y, mo, 1));
}
function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function addMonths(d: Date, delta: number) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1));
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const ok = await requirePermission(user, 'DEPARTMENT');
    if (!ok) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const allowedDeptIds = getAllowedDepartmentIds(user);
    if (Array.isArray(allowedDeptIds) && allowedDeptIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          points: [],
          limits: {},
          rangeLabel: "",
          departments: [],
          withData: [],
        },
      });
    }

    const { searchParams } = new URL(req.url);
    const deptName = searchParams.get("dept");
    const fromParam = parseYM(searchParams.get("from"));
    const toParam = parseYM(searchParams.get("to"));

    // Default window = last 6 complete months
    const now = new Date();
    let end = startOfMonth(now);
    let start = addMonths(end, -5);
    let endExclusive = addMonths(end, 1);

    // Override via query
    if (fromParam) start = fromParam;
    if (toParam) {
      end = toParam;
      endExclusive = addMonths(end, 1);
    }

    // All departments (for pills), scoped when needed
    const allDepartments = await prisma.department.findMany({
      select: { id: true, name: true },
      where: allowedDeptIds === null ? undefined : { id: { in: allowedDeptIds } },
      orderBy: { name: "asc" },
    });

    // Departments with data in current window 
    const windowReadings = await prisma.reading.findMany({
      where: {
        is_null: false,
        reading_date: { gte: start, lt: endExclusive },
        Dosimeter: {
          is: {
            is_control: false,
            ...(allowedDeptIds === null ? {} : { department_id: { in: allowedDeptIds } }),
          },
        },
      },
      select: { Dosimeter: { select: { department_id: true } } },
    });
    const withDataIds = Array.from(
      new Set(
        windowReadings
          .map((r) => r.Dosimeter?.department_id)
          .filter((n): n is number => Number.isFinite(n as number))
      )
    );
    const withDataNames = new Set(
      allDepartments.filter((d) => withDataIds.includes(d.id)).map((d) => d.name)
    );

   
    if (withDataIds.length === 0 && !fromParam && !toParam) {
      const latest = await prisma.reading.findFirst({
        where: { is_null: false, Dosimeter: { is: { is_control: false } } },
        select: { reading_date: true },
        orderBy: { reading_date: "desc" },
      });
      if (latest?.reading_date) {
        end = startOfMonth(latest.reading_date);
        start = addMonths(end, -5);
        endExclusive = addMonths(end, 1);

        const win2 = await prisma.reading.findMany({
          where: {
            is_null: false,
            reading_date: { gte: start, lt: endExclusive },
            Dosimeter: {
              is: {
                is_control: false,
                ...(allowedDeptIds === null ? {} : { department_id: { in: allowedDeptIds } }),
              },
            },
          },
          select: { Dosimeter: { select: { department_id: true } } },
        });
        const ids2 = Array.from(
          new Set(
            win2
              .map((r) => r.Dosimeter?.department_id)
              .filter((n): n is number => Number.isFinite(n as number))
          )
        );
        withDataNames.clear();
        allDepartments
          .filter((d) => ids2.includes(d.id))
          .forEach((d) => withDataNames.add(d.name));
      }
    }

    
    let deptId: number | undefined;
    if (deptName) {
      const match = allDepartments.find((d) => d.name === deptName);
      if (!match) {
        return NextResponse.json({
          success: true,
          data: {
            points: [],
            limits: {},
            rangeLabel: "",
            departments: allDepartments,          
            withData: Array.from(withDataNames), 
          },
        });
      }
      deptId = match.id;
    }

    // Readings for the selected (or “all”) department
    const readings = await prisma.reading.findMany({
      where: {
        is_null: false,
        reading_date: { gte: start, lt: endExclusive },
        Dosimeter: {
          is: {
            is_control: false,
            ...(deptId ? { department_id: deptId } : {}),
            ...(allowedDeptIds === null ? {} : { department_id: { in: allowedDeptIds } }),
          },
        },
      },
      select: {
        reading_date: true,
        total_mSv_chest: true,
        total_mSv_eye: true,
        Dosimeter: { select: { department_id: true, worker_id: true } },
      },
    });

    if (readings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          points: [],
          limits: {},
          rangeLabel: "",
          departments: allDepartments,
          withData: Array.from(withDataNames),
        },
      });
    }

    // Worker -> primary role
    const workerIds = Array.from(
      new Set(readings.map((r) => r.Dosimeter?.worker_id).filter(Boolean) as number[])
    );
    const workers = await prisma.worker.findMany({
      where: { id: { in: workerIds } },
      select: { id: true, Role: { select: { id: true } } },
    });
    const workerPrimaryRole = new Map<number, number | null>();
    workers.forEach((w) => workerPrimaryRole.set(w.id, w.Role[0]?.id ?? null));

    // Limits
    const deptIdsForPoints = Array.from(
      new Set(
        readings
          .map((r) => r.Dosimeter?.department_id)
          .filter((n): n is number => Number.isFinite(n as number))
      )
    );
    const limits = await prisma.limit.findMany({
      where: { department_id: { in: deptIdsForPoints } },
      select: { department_id: true, role_id: true, placement: true, limit_dose_mSv: true },
    });

    const roleLimit = new Map<string, number>();
    const deptMinByPlacement = new Map<string, number>();
    for (const l of limits) {
      const roleKey = `${l.department_id}|${l.role_id}|${l.placement}`;
      roleLimit.set(roleKey, Number(l.limit_dose_mSv));
      const deptKey = `${l.department_id}|${l.placement}`;
      const cur = deptMinByPlacement.get(deptKey);
      const val = Number(l.limit_dose_mSv);
      if (cur == null || val < cur) deptMinByPlacement.set(deptKey, val);
    }

    type Bucket = {
      y: number;
      m: number;
      chestSum: number;
      eyeSum: number;
      chestN: number;
      eyeN: number;
      chestAny: boolean;
      eyeAny: boolean;
    };
    const buckets = new Map<string, Bucket>();
    const perWorkerMonth = new Map<
      string,
      { chest: number; eye: number; deptId: number; workerId: number }
    >();

    for (const r of readings) {
      const monthKey = ymKey(r.reading_date);
      const y = r.reading_date.getUTCFullYear();
      const m = r.reading_date.getUTCMonth() + 1;
      const dept = r.Dosimeter!.department_id!;
      const worker = r.Dosimeter!.worker_id!;

      if (!buckets.has(monthKey)) {
        buckets.set(monthKey, {
          y,
          m,
          chestSum: 0,
          eyeSum: 0,
          chestN: 0,
          eyeN: 0,
          chestAny: false,
          eyeAny: false,
        });
      }
      const b = buckets.get(monthKey)!;

      const chest = Number(r.total_mSv_chest || 0);
      const eye = Number(r.total_mSv_eye || 0);

      b.chestSum += chest;
      b.eyeSum += eye;
      if (chest > 0) b.chestN += 1;
      if (eye > 0) b.eyeN += 1;

      const wkKey = `${worker}|${dept}|${monthKey}`;
      if (!perWorkerMonth.has(wkKey)) {
        perWorkerMonth.set(wkKey, { chest: 0, eye: 0, deptId: dept, workerId: worker });
      }
      const acc = perWorkerMonth.get(wkKey)!;
      acc.chest += chest;
      acc.eye += eye;
    }

    for (const [k, rec] of perWorkerMonth.entries()) {
      const [, , monthKey] = k.split("|");
      const b = buckets.get(monthKey);
      if (!b) continue;

      const roleId = workerPrimaryRole.get(rec.workerId) ?? null;
      const deptIdForRec = rec.deptId;

      const chestRoleKey = roleId != null ? `${deptIdForRec}|${roleId}|${Placement.CHEST}` : null;
      const eyeRoleKey = roleId != null ? `${deptIdForRec}|${roleId}|${Placement.EYE}` : null;

      const chestLimit =
        (chestRoleKey ? roleLimit.get(chestRoleKey) : undefined) ??
        deptMinByPlacement.get(`${deptIdForRec}|${Placement.CHEST}`);
      const eyeLimit =
        (eyeRoleKey ? roleLimit.get(eyeRoleKey) : undefined) ??
        deptMinByPlacement.get(`${deptIdForRec}|${Placement.EYE}`);

      if (typeof chestLimit === "number" && rec.chest > chestLimit) b.chestAny = true;
      if (typeof eyeLimit === "number" && rec.eye > eyeLimit) b.eyeAny = true;
    }

    const points = Array.from(buckets.values())
      .sort((a, b) => (a.y === b.y ? a.m - b.m : a.y - b.y))
      .map((b) => ({
        y: b.y,
        m: b.m,
        chestMean: b.chestN ? b.chestSum / b.chestN : 0,
        eyeMean: b.eyeN ? b.eyeSum / b.eyeN : 0,
        chestExceeds: b.chestAny,
        eyeExceeds: b.eyeAny,
      }));

    return NextResponse.json({
      success: true,
      data: {
        points,
        limits: {},
        rangeLabel: "",
        departments: allDepartments,          
        withData: Array.from(withDataNames), 
      },
    });
  } catch (e) {
    console.error("/api/departments/stats error:", e);
    return NextResponse.json({ success: false, error: "stats_failed" }, { status: 500 });
  }
}
