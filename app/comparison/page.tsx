// app/comparison/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import YearPills from "@/app/department/[id]/_components/YearPills";
import ComparisonChartCard from "./_components/ChartCard";
import DeptSelectCard from "./_components/DeptSelectCard";

type Dept = { id: number; name: string };
type StatsPoint = {
  y: number;
  m: number;
  chestMean: number;
  eyeMean: number;
  chestExceeds: boolean;
  eyeExceeds: boolean;
};
type StatsResponse = {
  success: true;
  data: {
    points: StatsPoint[];
    departments: Dept[];
    withData: string[];
  };
};

type Metric = "CHEST" | "EYE";

function ym(firstMonth = 1, lastMonth = 12, year?: number) {
  const y = year ?? new Date().getUTCFullYear();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return { from: `${y}-${pad(firstMonth)}`, to: `${y}-${pad(lastMonth)}` };
}

/* simple tabs for metric */
function MetricTabs({
  value,
  onChange,
}: {
  value: Metric;
  onChange: (m: Metric) => void;
}) {
  const items: Metric[] = ["CHEST", "EYE"];
  return (
    <div
      role="tablist"
      aria-label="Metric"
      className="inline-flex rounded-xl border bg-muted p-1"
    >
      {items.map((m) => {
        const selected = value === m;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(m)}
            className={[
              "px-3 py-1.5 rounded-lg text-xs font-medium transition",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {m === "CHEST" ? "Chest" : "Eye"}
          </button>
        );
      })}
    </div>
  );
}

export default function ComparisonPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // URL ↔ state
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(sp.get("dept") || "");
  const [year, setYear] = useState<number>(
    Number(sp.get("year")) || new Date().getUTCFullYear()
  );
  const [metric, setMetric] = useState<Metric>(
    sp.get("metric") === "EYE" ? "EYE" : "CHEST"
  );
  const [points, setPoints] = useState<StatsPoint[]>([]);
  const [withData, setWithData] = useState<Set<string>>(new Set());

  useEffect(() => {
    const y = Number(sp.get("year")) || new Date().getUTCFullYear();
    const d = sp.get("dept") || "";
    const m = sp.get("metric") === "EYE" ? "EYE" : "CHEST";
    if (y !== year) setYear(y);
    if (d !== selectedDept) setSelectedDept(d);
    if (m !== metric) setMetric(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const yearsForPills = useMemo(() => {
    const fromData = Array.from(new Set(points.map((p) => p.y)));
    const base = new Set<number>([
      new Date().getUTCFullYear() - 1,
      new Date().getUTCFullYear(),
    ]);
    fromData.forEach((y) => base.add(y));
    return Array.from(base).sort((a, b) => a - b);
  }, [points]);

  // push state to URL (no scroll jump)
  useEffect(() => {
    const params = new URLSearchParams(sp?.toString() || "");
    params.set("year", String(year));
    params.set("metric", metric);
    if (selectedDept) params.set("dept", selectedDept);
    else params.delete("dept");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, selectedDept, metric]);

  // Fetch stats for (dept, year)
  useEffect(() => {
    const { from, to } = ym(1, 12, year);
    const q = new URLSearchParams();
    if (selectedDept) q.set("dept", selectedDept);
    q.set("from", from);
    q.set("to", to);

    fetch(`/api/departments/stats?${q.toString()}`)
      .then((r) => r.json())
      .then((body: StatsResponse) => {
        if (body?.success) {
          setDepartments(body.data.departments || []);
          setPoints(body.data.points || []);
          setWithData(new Set(body.data.withData || []));
          if (!selectedDept) {
            const byData = body.data.departments.find((d) =>
              body.data.withData.includes(d.name)
            );
            setSelectedDept(
              byData?.name || body.data.departments[0]?.name || ""
            );
          }
        } else {
          setPoints([]);
        }
      })
      .catch(() => setPoints([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDept, year]);

  const chartData = useMemo(
    () =>
      points.map((p) => ({
        m: p.m,
        y: p.y,
        value:
          metric === "CHEST" ? Number(p.chestMean || 0) : Number(p.eyeMean || 0),
        chestExceeds: p.chestExceeds,
        eyeExceeds: p.eyeExceeds,
      })),
    [points, metric]
  );

  const sub =
    selectedDept
      ? `${selectedDept} • ${year} • ${metric === "CHEST" ? "Chest" : "Eye"}`
      : `${year} • ${metric === "CHEST" ? "Chest" : "Eye"}`;

  return (
    <AppShell active="comparison">
      <PageHeader
        title="Comparison"
        description={`Compare average monthly exposure. ${sub}`}
        titleClassName="text-[#16a34a]" // green title
      />

      {/* Filters: metric tabs + year pills */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <MetricTabs value={metric} onChange={setMetric} />
            <YearPills years={yearsForPills} selectedYear={year} fullBleed={false} />
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <ComparisonChartCard
        departmentName={selectedDept}
        year={year}
        data={chartData}
      />

      {/* Department selector */}
      <DeptSelectCard
        departments={departments}
        withData={withData}
        value={selectedDept}
        onChange={setSelectedDept}
      />
    </AppShell>
  );
}
