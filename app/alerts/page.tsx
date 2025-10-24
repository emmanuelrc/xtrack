// app/alerts/page.tsx
// Make the page title use the brand green (#16a34a). Everything else unchanged.

import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllExceedances } from "@/lib/db/alerts";
import {
  requireAuth,
  extractPermissions,
  getAllowedDepartmentIds,
} from "@/lib/auth";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default async function AlertsPage({
  searchParams,
}: {
  searchParams?: { year?: string };
}) {
  const user = await requireAuth();
  if (!user) redirect("/login");

  const perms = extractPermissions(user);
  const hasAll = perms.includes("ALL");
  const hasDept = perms.includes("DEPARTMENT");
  const hasWorker = perms.includes("WORKER");

  // worker-only users go to their worker alerts
  if (!hasAll && !hasDept && hasWorker && user.Worker?.id) {
    redirect(`/worker/${user.Worker.id}/alerts`);
  }

  const yearNum = Number(searchParams?.year);
  const year = Number.isFinite(yearNum) ? yearNum : undefined;

  const allowedDeptIds = getAllowedDepartmentIds(user);
  const items = await getAllExceedances({ year }, allowedDeptIds);

  const sub = year != null ? `Organisation • ${year}` : "Organisation • All placements";

  return (
    <AppShell active="alerts">
      <PageHeader
        title="Over-limit alerts"
        description={sub}
        titleClassName="text-[#16a34a]"
        actions={
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Back to dashboard</Button>
          </Link>
        }
      />

      <Card>
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
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No exceedances{year ? ` in ${year}` : ""}.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((e, i) => (
                  <TableRow key={`${e.workerId}-${e.placement}-${e.month}-${i}`}>
                    <TableCell>{MONTHS[e.month - 1]}</TableCell>
                    <TableCell className="truncate">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {e.role ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="uppercase text-xs tracking-wide">
                      <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-200">
                        {e.placement}
                        <span className="ml-2 text-[10px] font-medium text-rose-600">
                          +{e.percent_over.toFixed(0)}%
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium numeric">
                      {e.dose_mSv.toFixed(2)} mSv
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground numeric">
                      {e.limit_mSv.toFixed(2)} mSv
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
