// app/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import DashboardAlertsCard from "./_components/DashboardAlertsCard";
import StatsCard from "./_components/StatsCard";

// Temporary user stub. Replace with real auth/user context.
const user = { name: "Erdem Wilson", initials: "EW" };

type DashboardAlert = {
  workerId: number;
  name: string;
  role: string | null;
  month: number;           // 1..12
  reading_mSv: number;
  limit_mSv: number;
  placement?: "CHEST" | "EYE";
  percent_over?: number;
};

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<DashboardAlert[] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/alerts?limit=3", { cache: "no-store" });
        const body = await res.json();
        const data = (body?.data ?? []).map((e: any) => ({
          workerId: e.workerId,
          name: e.name,
          role: e.role ?? null,
          month: e.month,
          reading_mSv: e.dose_mSv,
          limit_mSv: e.limit_mSv,
          placement: e.placement,
          percent_over: e.percent_over,
        })) as DashboardAlert[];
        setAlerts(data);
      } catch {
        setAlerts([]);
      }
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-xs text-gray-500">Welcome back,</div>
            <div className="text-sm font-semibold text-emerald-700">{user.name}</div>
          </div>
        </div>
        <Link href="/alerts" aria-label="View recent notifications">
          <Card className="p-2 bg-gray-100 shadow-sm hover:bg-gray-200 transition">
            <Bell className="h-5 w-5 text-gray-700" />
          </Card>
        </Link>
      </header>

      <h1 className="text-lg font-semibold text-emerald-700">Dashboard</h1>

      {/* Alerts overview: whole card links to /alerts */}
      <section>
        <h2 className="text-gray-700 text-base font-semibold mb-2">Alerts</h2>
        <Link
          href="/alerts"
          className="block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl"
          aria-label="Open full over-limit alerts list"
        >
          <DashboardAlertsCard alerts={alerts ?? []} />
        </Link>
      </section>

      {/* Statistics */}
      <section>
        <h2 className="text-gray-700 text-base font-semibold mb-2">Statistics</h2>
        <StatsCard />
      </section>

      {/* Manage org */}
      <section className="pt-2">
        <Link
          href="/organisation"
          className="inline-flex w-full items-center justify-center rounded-xl bg-gray-200 py-3 text-sm font-medium text-gray-800 hover:bg-gray-300 transition"
        >
          Manage your Organisation
        </Link>
      </section>
    </main>
  );
}
