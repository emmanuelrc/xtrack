import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'; // ensure this layout runs on the server each request

async function getPermissionsFromRequest() {
  // TODO when auth is working, check auth token for permissions
  return 'ALL'
}

export default async function OrganisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perms = await getPermissionsFromRequest();
  if (!perms?.includes('ALL')) {
    redirect('/');
  }
  return <>{children}</>;
}
