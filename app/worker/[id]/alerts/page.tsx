// app/worker/[id]/alerts/page.tsx
import { notFound } from "next/navigation";
import type { Placement } from "@prisma/client";
import {
  getWorkerById,
  getWorkerYears,
  getWorkerMonthlyExceedances,
} from "@/lib/db/worker";
import YearPills from "../_components/YearPills";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function AlertsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { year?: string }; // ⬅️ placement removed from type
}) {
  const workerId = Number(params.id);
  if (!Number.isFinite(workerId)) notFound();

  const basics = await getWorkerById(workerId);
  if (!basics) notFound();

  const years = await getWorkerYears(workerId);
  const fallbackYear = years.length ? years[years.length - 1] : new Date().getUTCFullYear();
  const year = Number(searchParams?.year) || fallbackYear;

  // ⬅️ Fetch exceedances for ALL placements
  const exceedances = await getWorkerMonthlyExceedances(workerId, year /* no placement */);

  return (
    <main className="max-w-sm mx-auto p-4 h-screen overflow-y-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-green-700">Over-limit alerts</h1>
          <p className="text-sm text-gray-500">{basics.fullName}</p>
          <p className="mt-0.5 text-xs text-gray-500">Showing all placements</p>
        </div>
        <Link
          href={`/worker/${workerId}?year=${year}`}
          className="text-sm text-emerald-700 hover:underline"
        >
          Back to worker
        </Link>
      </div>

      <YearPills
        years={years.length ? years : [year - 1, year]}
        selectedYear={year}
        fullBleed={false}
        compact
      />

      <Card className="bg-white shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">Month</TableHead>
                <TableHead className="w-[28%]">Placement</TableHead>
                <TableHead className="w-[22%] text-right">Dose (mSv)</TableHead>
                <TableHead className="w-[22%] text-right">Limit (mSv)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exceedances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-gray-500">
                    No exceedances for {year}.
                  </TableCell>
                </TableRow>
              ) : (
                exceedances.map((e, i) => (
                  <TableRow key={`${e.month}-${e.placement}-${i}`}>
                    <TableCell>{MONTHS[e.month - 1]}</TableCell>
                    <TableCell className="uppercase text-xs tracking-wide">
                      <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-200">
                        {e.placement}
                        <span className="ml-2 text-[10px] font-medium text-rose-600">
                          +{e.percent_over.toFixed(0)}%
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{e.dose_mSv.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-gray-600">{e.limit_mSv.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
