import { notFound } from "next/navigation";
import {
  getDepartmentById,
  getDepartmentYears,
  getDepartmentWorkersWithLastReading,
  getDepartmentMonthlyReadings,
  getDepartmentAlerts,
} from "@/lib/db/department";
import ScreenHeader from "./_components/ScreenHeader";
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
  const fallbackYear = years.length ? years[years.length - 1] : new Date().getUTCFullYear();
  const year = Number(searchParams?.year) || fallbackYear;

  const [workers, monthly, alerts] = await Promise.all([
    getDepartmentWorkersWithLastReading(deptId),
    getDepartmentMonthlyReadings(deptId, year),
    getDepartmentAlerts(deptId, year),
  ]);

  return (
    <main className="max-w-sm mx-auto p-4 h-screen overflow-y-auto space-y-4">
      <ScreenHeader title={dept.name} />
      <WorkerTableCard workers={workers} />
      <div className="flex items-center justify-between">
        <YearPills years={years.length ? years : [year - 1, year]} selectedYear={year} />
      </div>
      <ChartCard data={monthly} />
      <AlertsCard alerts={alerts} />
    </main>
  );
}
