// app/worker/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Placement } from "@prisma/client";
import {
  getWorkerById,
  getWorkerYears,
  getWorkerPlacements,
  getWorkerMonthlyReadings,
  getWorkerMonthlyLimit,
} from "@/lib/db/worker";
import WorkerHeader from "./_components/WorkerHeader";
import YearPills from "./_components/YearPills";
import ChartCard from "./_components/ChartCard";
import ClientPlacementToggle from "./_components/ClientPlacementToggle";

export default async function WorkerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { year?: string; placement?: Placement };
}) {
  const workerId = Number(params.id);
  if (!Number.isFinite(workerId)) notFound();

  const basics = await getWorkerById(workerId);
  if (!basics) notFound();

  const years = await getWorkerYears(workerId);
  const placements = await getWorkerPlacements(workerId);

  const fallbackYear = years.length ? years[years.length - 1] : new Date().getUTCFullYear();
  const year = Number(searchParams?.year) || fallbackYear;

  const selectedPlacement = (searchParams?.placement as Placement) || placements[0];

  const [monthly, limit] = await Promise.all([
    getWorkerMonthlyReadings(workerId, year, selectedPlacement),
    selectedPlacement ? getWorkerMonthlyLimit(workerId, selectedPlacement) : Promise.resolve(null),
  ]);

  return (
    <main className="max-w-sm mx-auto p-4 h-screen overflow-y-auto space-y-4">
<WorkerHeader
  name={basics.fullName}
  role={basics.role ?? undefined}
  department={basics.department ?? undefined}
  alertsHref={`/worker/${workerId}/alerts?year=${year}`} // ⬅️ no placement param
/>

      <div className="flex items-center justify-between">
        <YearPills years={years.length ? years : [year - 1, year]} selectedYear={year} />
      </div>

      <ChartCard data={monthly} limit={limit ?? undefined} />

      <ClientPlacementToggle placements={placements} selected={selectedPlacement} />
    </main>
  );
}
