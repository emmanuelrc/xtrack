import { requireAuth, requirePermission } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  if (!user) redirect('/login')
  const ok = await requirePermission(user, 'WORKER')
  if (!ok) redirect('/dashboard')
  return <>{children}</>
}


