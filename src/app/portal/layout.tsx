import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { PortalShell } from '@/components/portal/PortalShell';

export const metadata = { title: 'My Garage' };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/portal');
  if (session.role !== ROLES.CUSTOMER) redirect('/admin');

  return (
    <PortalShell user={{ name: session.name, email: session.email }}>{children}</PortalShell>
  );
}
