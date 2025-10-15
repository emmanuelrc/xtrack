// app/alerts/page.tsx


import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllExceedances } from "@/lib/db/alerts";
import { requireAuth, extractPermissions, getAllowedDepartmentIds } from "@/lib/auth";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function AlertsPage({
  searchParams,
}: {
  searchParams?: { year?: string };
}) {
  const user = await requireAuth();
  if (!user) redirect('/login');

  const perms = extractPermissions(user);
  const hasAll = perms.includes('ALL');
  const hasDept = perms.includes('DEPARTMENT');
  const hasWorker = perms.includes('WORKER');

  if (!hasAll && !hasDept && hasWorker && user.Worker?.id) {
    redirect(`/worker/${user.Worker.id}/alerts`);
  }

  const yearNum = Number(searchParams?.year);
  const year = Number.isFinite(yearNum) ? yearNum : undefined;

  const allowedDeptIds = getAllowedDepartmentIds(user);
  const items = await getAllExceedances({ year }, allowedDeptIds);

  return (
    <main className="max-w-sm mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-green-700">Over-limit alerts</h1>
          <p className="text-sm text-gray-500">Organisation</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {year ? `Showing all placements — ${year}` : "Showing all placements"}
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-emerald-700 hover:underline">
          Back to dashboard
        </Link>
      </div>

      <Card className="bg-white shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[26%]">Month</TableHead>
                <TableHead className="w-[30%]">Worker</TableHead>
                <TableHead className="w-[18%]">Placement</TableHead>
                <TableHead className="w-[13%] text-right">Dose</TableHead>
                <TableHead className="w-[13%] text-right">Limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-gray-500">
                    No exceedances{year ? ` in ${year}` : ""}.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((e, i) => (
                  <TableRow key={`${e.workerId}-${e.placement}-${e.month}-${i}`}>
                    <TableCell>{MONTHS[e.month - 1]}</TableCell>
                    <TableCell className="truncate">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-[10px] text-gray-600">{e.role ?? "—"}</div>
                    </TableCell>
                    <TableCell className="uppercase text-xs tracking-wide">
                      <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-200">
                        {e.placement}
                        <span className="ml-2 text-[10px] font-medium text-rose-600">
                          +{e.percent_over.toFixed(0)}%
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {e.dose_mSv.toFixed(2)} mSv
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {e.limit_mSv.toFixed(2)} mSv
                    </TableCell>
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
