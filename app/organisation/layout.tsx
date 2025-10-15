import { requireAuth, requirePermission } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // ensure this layout runs on the server each request

export default async function OrganisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const user = await requireAuth()
  if (!user) redirect('/login');
  const perms = await requirePermission(user, 'ALL')
  // TODO: redirect to the right place
  if (!perms) redirect('/dashboard'); 
  return <>{children}</>;
}
