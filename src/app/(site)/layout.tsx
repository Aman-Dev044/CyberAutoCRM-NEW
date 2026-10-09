import { getSession } from '@/lib/auth';
import { getPublicSettings } from '@/server/settings';
import { STAFF_ROLES } from '@/lib/constants';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getSession(), getPublicSettings()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        signedIn={!!session}
        homeHref={session && STAFF_ROLES.includes(session.role) ? '/admin' : '/portal'}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter garage={settings.garage} />
    </div>
  );
}
