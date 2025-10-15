// app/dashboard/page.tsx

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import DashboardAlertsCard from './_components/DashboardAlertsCard'
import StatsCard from './_components/StatsCard'
import { extractPermissions, requireAuth, getAllowedDepartmentIds } from '@/lib/auth'
import { getRecentExceedances } from '@/lib/db/alerts'

type DashboardAlert = {
  workerId: number
  name: string
  role: string | null
  month: number
  reading_mSv: number
  limit_mSv: number
  placement?: 'CHEST' | 'EYE'
  percent_over?: number
}

async function getAlerts(allowedDeptIds: number[] | null): Promise<DashboardAlert[]> {
  const rows = await getRecentExceedances(3, allowedDeptIds)
  return rows.map((e: any) => ({
    workerId: e.workerId,
    name: e.name,
    role: e.role ?? null,
    month: e.month,
    reading_mSv: e.dose_mSv,
    limit_mSv: e.limit_mSv,
    placement: e.placement,
    percent_over: e.percent_over,
  }))
}

export default async function DashboardPage() {
  const user = await requireAuth()
  if (!user) redirect('/login')

  const perms = extractPermissions(user)
  const hasAll = perms.includes('ALL')
  const hasDept = perms.includes('DEPARTMENT')
  const hasWorker = perms.includes('WORKER')

  if (!hasAll && !hasDept && hasWorker && user.Worker?.id) {
    redirect(`/worker/${user.Worker.id}`)
  }

  const allowedDeptIds = getAllowedDepartmentIds(user)
  const alerts = await getAlerts(allowedDeptIds)
  const headDeptId = hasDept && user.Worker?.Department?.[0]?.id

  const initials = (user.name?.split(' ').map(p => p[0]).join('') || user.username.slice(0,2) || 'U').toUpperCase()
  const displayName = user.name || user.username

  return (
    <main className="mx-auto max-w-md px-4 py-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-xs text-gray-500">Welcome back,</div>
            <div className="text-sm font-semibold text-emerald-700">{displayName}</div>
          </div>
        </div>
        <Link href="/alerts" aria-label="View recent notifications">
          <Card className="p-2 bg-gray-100 shadow-sm hover:bg-gray-200 transition">
            <Bell className="h-5 w-5 text-gray-700" />
          </Card>
        </Link>
      </header>

      <h1 className="text-lg font-semibold text-emerald-700">Dashboard</h1>

      <section>
        <h2 className="text-gray-700 text-base font-semibold mb-2">Alerts</h2>
        <Link
          href="/alerts"
          className="block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl"
          aria-label="Open full over-limit alerts list"
        >
          <DashboardAlertsCard alerts={alerts} />
        </Link>
      </section>

      {(hasAll || hasDept) && (
        <section>
          <h2 className="text-gray-700 text-base font-semibold mb-2">Statistics</h2>
          <StatsCard />
        </section>
      )}

      {hasAll && (
        <section className="pt-2">
          <Link
            href="/organisation"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gray-200 py-3 text-sm font-medium text-gray-800 hover:bg-gray-300 transition"
          >
            Manage your Organisation
          </Link>
        </section>
      )}

      {hasDept && headDeptId && (
        <section className="pt-2">
          <Link
            href={`/department/${headDeptId}/edit`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gray-200 py-3 text-sm font-medium text-gray-800 hover:bg-gray-300 transition"
          >
            Manage your Department
          </Link>
        </section>
      )}
    </main>
  )
}
