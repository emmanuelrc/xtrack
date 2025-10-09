// app/worker/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Placement } from "@prisma/client";
import {
  getWorkerById,
  getWorkerYears,
  getWorkerPlacements,
  getWorkerMonthlyReadings,
} from "@/lib/db/worker";
import WorkerHeader from "./_components/WorkerHeader";
import YearPills from "./_components/YearPills";
import ChartCard from "./_components/ChartCard";
import ClientPlacementToggle from "./_components/ClientPlacementToggle"; // ✅ use the new file

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

  // default to first available placement; if none (edge case), page still renders
  const selectedPlacement = (searchParams?.placement as Placement) || placements[0];

  const monthly = await getWorkerMonthlyReadings(workerId, year, selectedPlacement);

  return (
    <main className="max-w-sm mx-auto p-4 h-screen overflow-y-auto space-y-4">
      <WorkerHeader
        name={basics.fullName}
        role={basics.role ?? undefined}
        department={basics.department ?? undefined}
      />

      {/* Year selector */}
      <div className="flex items-center justify-between">
        <YearPills years={years.length ? years : [year - 1, year]} selectedYear={year} />
      </div>

      {/* Chart */}
      <ChartCard data={monthly} />

      {/* Dosimeter toggle (only shows if >1) */}
      <ClientPlacementToggle placements={placements} selected={selectedPlacement} />
    </main>
  );
}
