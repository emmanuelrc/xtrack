// app/dashboard/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import DashboardAlertsCard from "./_components/DashboardAlertsCard";
import StatsCard from "./_components/StatsCard";
import {
  extractPermissions,
  requireAuth,
  getAllowedDepartmentIds,
} from "@/lib/auth";
import { getRecentExceedances } from "@/lib/db/alerts";
import { Building2, Settings, ChevronRight } from "lucide-react";

type DashboardAlert = {
  workerId: number;
  name: string;
  role: string | null;
  month: number;
  reading_mSv: number;
  limit_mSv: number;
  placement?: "CHEST" | "EYE";
  percent_over?: number;
};

async function getAlerts(
  allowedDeptIds: number[] | null
): Promise<DashboardAlert[]> {
  const rows = await getRecentExceedances(3, allowedDeptIds);
  return rows.map((e: any) => ({
    workerId: e.workerId,
    name: e.name,
    role: e.role ?? null,
    month: e.month,
    reading_mSv: e.dose_mSv,
    limit_mSv: e.limit_mSv,
    placement: e.placement,
    percent_over: e.percent_over,
  }));
}

export default async function DashboardPage() {
  const user = await requireAuth();
  if (!user) redirect("/login");

  const perms = extractPermissions(user);
  const hasAll = perms.includes("ALL");
  const hasDept = perms.includes("DEPARTMENT");
  const hasWorker = perms.includes("WORKER");

  // worker-only users go to their worker screen
  if (!hasAll && !hasDept && hasWorker && user.Worker?.id) {
    redirect(`/worker/${user.Worker.id}`);
  }

  const allowedDeptIds = getAllowedDepartmentIds(user);
  const alerts = await getAlerts(allowedDeptIds);
  const headDeptId = hasDept && user.Worker?.Department?.[0]?.id;

  const displayName = user.name || user.username;

  return (
    <AppShell active="dashboard">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${displayName}`}
        titleClassName="text-[#16a34a]"
      />

      {/* Alerts card (title is inside the card) */}
      <section>
        <Link
          href="/alerts"
          className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-xl"
          aria-label="Open full over-limit alerts list"
        >
          <DashboardAlertsCard alerts={alerts} />
        </Link>
      </section>

      {/* Stats — no external 'Statistics' heading; add bottom margin so CTAs don't collide */}
      {(hasAll || hasDept) && (
        <section className="mt-2 mb-4">
          <StatsCard />
        </section>
      )}

      {/* Management shortcuts */}
      <div className="grid grid-cols-1 gap-2 mt-2">
        {hasAll && (
          <Link
            href="/organisation"
            aria-label="Manage your Organisation"
            className="group block w-full focus:outline-none"
          >
            <div
              className="flex items-center justify-between gap-3 rounded-2xl border border-border
                         bg-[#d0d1d1] px-4 py-3 shadow-sm transition
                         hover:bg-[#e5e7eb] active:translate-y-[1px]
                         focus-visible:ring-2 focus-visible:ring-[#16a34a]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#16a34a]/10 text-[#16a34a]">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-[#4b5563]">
                  Manage your Organisation
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#6b7280] group-hover:text-[#374151]" />
            </div>
          </Link>
        )}

        {hasDept && headDeptId && (
          <Link
            href={`/department/${headDeptId}/edit`}
            aria-label="Manage your Department"
            className="group block w-full focus:outline-none"
          >
            <div
              className="flex items-center justify-between gap-3 rounded-2xl border border-border
                         bg-[#d0d1d1] px-4 py-3 shadow-sm transition
                         hover:bg-[#e5e7eb] active:translate-y-[1px]
                         focus-visible:ring-2 focus-visible:ring-[#16a34a]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#16a34a]/10 text-[#16a34a]">
                  <Settings className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-[#4b5563]">
                  Manage your Department
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#6b7280] group-hover:text-[#374151]" />
            </div>
          </Link>
        )}
      </div>
    </AppShell>
  );
}
