// app/comparison/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import YearPills from "@/app/department/[id]/_components/YearPills";
import AlertsButton from "./_components/AlertsButton";
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
    withData: string[]; // department names with data in window
  };
};

function ym(firstMonth = 1, lastMonth = 12, year?: number) {
  const y = year ?? new Date().getUTCFullYear();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return { from: `${y}-${pad(firstMonth)}`, to: `${y}-${pad(lastMonth)}` };
}

export default function ComparisonPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Local mirrors of URL params
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(sp.get("dept") || "");
  const [year, setYear] = useState<number>(
    Number(sp.get("year")) || new Date().getUTCFullYear()
  );
  const [points, setPoints] = useState<StatsPoint[]>([]);
  const [withData, setWithData] = useState<Set<string>>(new Set());

  
  useEffect(() => {
    const y = Number(sp.get("year")) || new Date().getUTCFullYear();
    const d = sp.get("dept") || "";
    if (y !== year) setYear(y);
    if (d !== selectedDept) setSelectedDept(d);
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

 
  useEffect(() => {
    const params = new URLSearchParams(sp?.toString() || "");
    params.set("year", String(year));
    if (selectedDept) params.set("dept", selectedDept);
    else params.delete("dept");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, selectedDept]);

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
        value: Number(p.chestMean || 0), // single-series (CHEST)
        chestExceeds: p.chestExceeds,
      })),
    [points]
  );

  return (
    <main className="max-w-sm mx-auto p-4 h-screen overflow-y-auto space-y-4">
      {/* Header card: title + alerts bell */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-xl">Comparison</CardTitle>
          <CardDescription>
            Select a year and department to compare average monthly exposure.
          </CardDescription>
          <CardAction>
            <AlertsButton year={year} />
          </CardAction>
        </CardHeader>
<CardContent className="pt-2">
  <YearPills years={yearsForPills} selectedYear={year} fullBleed={false} />
</CardContent>
      </Card>

      {/* Chart */}
      <ComparisonChartCard
        departmentName={selectedDept}
        year={year}
        data={chartData}
      />

      {/* Department selector card (full names list) */}
      <DeptSelectCard
        departments={departments}
        withData={withData}
        value={selectedDept}
        onChange={setSelectedDept}
      />
    </main>
  );
}
