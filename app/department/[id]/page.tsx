// app/department/[id]/page.tsx

import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import {
  getDepartmentById,
  getDepartmentYears,
  getDepartmentWorkersWithLastReading,
  getDepartmentMonthlyReadings,
  getDepartmentAlerts,
} from "@/lib/db/department";
import { getDepartmentMonthlyLimit } from "@/lib/db/limits";
import WorkerTableCard from "./_components/WorkerTableCard";
import YearPills from "./_components/YearPills";
import ChartCard from "./_components/ChartCard";
import AlertsCard from "./_components/AlertsCard";

export default async function DepartmentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { year?: string };
}) {
  const deptId = Number(params.id);
  if (!Number.isFinite(deptId)) notFound();

  const dept = await getDepartmentById(deptId);
  if (!dept) notFound();

  const years = await getDepartmentYears(deptId);
  const fallbackYear = years.length
    ? years[years.length - 1]
    : new Date().getUTCFullYear();
  const year = Number(searchParams?.year) || fallbackYear;

  const [workers, monthly, alerts, limit] = await Promise.all([
    getDepartmentWorkersWithLastReading(deptId),
    getDepartmentMonthlyReadings(deptId, year),
    getDepartmentAlerts(deptId, year),
    getDepartmentMonthlyLimit(deptId),
  ]);

  return (
    <AppShell>
      <PageHeader
        title={dept.name}
        description={`Department • ${year}`}
        titleClassName="text-[#16a34a]" // brand green
      />

      <div className="space-y-4">
        <WorkerTableCard workers={workers} />

        <div className="flex items-center justify-between">
          <YearPills
            years={years.length ? years : [year - 1, year]}
            selectedYear={year}
          />
        </div>

        {/* pass limit through so the chart can draw threshold */}
        <ChartCard data={monthly} limit={limit ?? undefined} />

        <AlertsCard alerts={alerts} />
      </div>
    </AppShell>
  );
}
