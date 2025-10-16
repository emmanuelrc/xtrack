// app/dashboard/_components/StatsCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import StatsSwipe from "./StatsSwipe";
import DeptDonut, { type DeptCount } from "./DeptDonut";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type Dept = { id: number; name: string };
type Point = {
  y: number;
  m: number;
  chestMean: number;
  eyeMean: number;
  chestExceeds: boolean;
  eyeExceeds: boolean;
};

function abbr(name: string) {
  const map: Record<string, string> = {
    "Interventional Radiology": "IR",
    "Nuclear Medicine": "NM",
    Oncology: "ONC",
    Radiology: "RAD",
    Cardiology: "CAR",
    "Emergency Medicine": "EM",
    Orthopedics: "ORT",
    "Vascular Surgery": "VS",
  };
  return map[name] ?? name.slice(0, 3).toUpperCase();
}

export default function StatsCard() {
  const sp = useSearchParams();
  const qs = sp?.toString();
  const baseStatsUrl = qs ? `/api/departments/stats?${qs}` : `/api/departments/stats`;
  const baseCountsUrl = qs ? `/api/departments/worker-counts?${qs}` : `/api/departments/worker-counts`;
  const totalUrl = qs ? `/api/dosimeters/total?${qs}` : `/api/dosimeters/total`;

  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [withDataNames, setWithDataNames] = useState<Set<string>>(new Set());
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [deptCounts, setDeptCounts] = useState<DeptCount[] | null>(null);
  const [dosimeterTotal, setDosimeterTotal] = useState<number | null>(null);

  // departments 
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const res = await fetch(baseStatsUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const all: Dept[] = Array.isArray(json?.data?.departments) ? json.data.departments : [];
        const withData: string[] = Array.isArray(json?.data?.withData) ? json.data.withData : [];
        if (!cancelled) {
          setDepartments(all);
          setWithDataNames(new Set(withData));
          if (!activeDept) {
            const preferred = all.find((d) => withData.includes(d.name)) ?? all[0];
            if (preferred) setActiveDept(preferred.name);
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load statistics.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseStatsUrl]);

  // time series points for active department
  useEffect(() => {
    if (!activeDept) {
      setPoints([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const url =
          baseStatsUrl + (baseStatsUrl.includes("?") ? "&" : "?") + `dept=${encodeURIComponent(activeDept)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const pts: Point[] = Array.isArray(json?.data?.points) ? json.data.points : [];
        if (!cancelled) setPoints(pts);
      } catch {
        if (!cancelled) setError("Failed to load statistics.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeDept, baseStatsUrl]);

  // worker/dosimeter counts by department for the donut
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(baseCountsUrl, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const rows: DeptCount[] = Array.isArray(json?.data) ? json.data : [];
          if (!cancelled && rows.length) {
            setDeptCounts(rows);
            return;
          }
        }
      } catch {
        // ignore; fallback below
      }
      if (!cancelled) {
        const fallback: DeptCount[] = departments.map((d) => ({ name: d.name, count: 1 }));
        setDeptCounts(fallback);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseCountsUrl, departments]);

  // total dosimeters for the donut center
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(totalUrl, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const body = await res.json();
        const n = Number(body?.data?.total);
        if (!cancelled && Number.isFinite(n)) setDosimeterTotal(n);
      } catch {
        
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [totalUrl]);

  const chartData = useMemo(
    () =>
      points.map((p) => {
        const d = new Date(Date.UTC(p.y, p.m - 1, 1));
        const monthShort = d.toLocaleString("en-US", { month: "short" });
        const yearShort = d.toLocaleString("en-US", { year: "2-digit" });
        return { ...p, label: `${monthShort} ${yearShort}` };
      }),
    [points]
  );

  const exceedDot =
    (key: "chestExceeds" | "eyeExceeds") =>
    (props: any) => {
      const { cx, cy, payload } = props;
      if (!payload?.[key]) return null;
      return (
        <circle
          key={`${payload.y}-${payload.m}-${key}`}
          cx={cx}
          cy={cy}
          r={5}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      );
    };

  const hasDepts = departments.length > 0;

  // CHANGES: title → gray; card background → slightly gray
  const ExposureTrendsCard = (
    <Card className="bg-[#e2e2e2] shadow-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-base leading-5 text-[#4b5563]">
          Exposure Trends
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="-mt-1 mb-1">
          <div
            className="rounded-full bg-gray-300 px-1 py-0.5 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="inline-flex items-center gap-1 whitespace-nowrap">
              {hasDepts ? (
                departments.map((d) => {
                  const active = d.name === activeDept;
                  const dim = !withDataNames.has(d.name);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setActiveDept(d.name)}
                      className={[
                        "shrink-0 rounded-full h-6 px-2 text-[11px] leading-[1.1] transition-colors outline-none",
                        active
                          ? "bg-[#16a34a] text-white"
                          : dim
                          ? "text-gray-500 hover:text-gray-600"
                          : "text-gray-800 hover:text-gray-900",
                      ].join(" ")}
                      title={dim ? "No data in this period" : d.name}
                    >
                      {abbr(d.name)}
                    </button>
                  );
                })
              ) : (
                <span className="px-2 py-0.5 text-xs text-gray-500">No departments found.</span>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-600 mt-2">Failed to load statistics.</p>
        ) : !hasDepts ? (
          <p className="text-sm text-rose-600 mt-2">No departments available.</p>
        ) : (
          <div className="relative">
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1
                         text-[10px] text-gray-500 [writing-mode:vertical-rl] rotate-180 select-none"
              aria-hidden="true"
            >
              Avg. Exp. (mSv)
            </span>

            <div className="pl-6">
              <ChartContainer config={{}} className="h-[220px] w-full">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    width={36}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />

                  <defs>
                    <linearGradient id="fillEye" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.08} />
                    </linearGradient>
                    <linearGradient id="fillChest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>

                  <Area
                    type="monotone"
                    dataKey="eyeMean"
                    stroke="#f59e0b"
                    fill="url(#fillEye)"
                    strokeWidth={2}
                    dot={exceedDot("eyeExceeds")}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="chestMean"
                    stroke="#0f766e"
                    fill="url(#fillChest)"
                    strokeWidth={2}
                    dot={exceedDot("chestExceeds")}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center gap-5 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#0f766e" }} />
            Chest
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#f59e0b" }} />
            Eye
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#ef4444" }} />
            Exceedance
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const DonutCard = (
    <DeptDonut
      data={
        deptCounts ??
        departments.map((d) => ({ name: d.name, count: 1 }))
      }
      title="Dosimeters by Department"
      totalOverride={dosimeterTotal ?? undefined}
      centerLabel="Dosimeters"
    />
  );

  return <StatsSwipe>{[ExposureTrendsCard, DonutCard]}</StatsSwipe>;
}
