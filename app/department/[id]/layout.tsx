import { requireAuth, requirePermission } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DepartmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  if (!user) redirect('/login')
  const ok = await requirePermission(user, 'DEPARTMENT')
  if (!ok) redirect('/dashboard')
  return <>{children}</>
}


