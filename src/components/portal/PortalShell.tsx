'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarPlus, CarFront, FileText, Home, LogOut, User } from 'lucide-react';
import { Logo } from '@/components/site/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui/Stat';
import { apiPost } from '@/lib/client';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/portal', label: 'Overview', icon: Home, exact: true },
  { href: '/portal/vehicles', label: 'My vehicles', icon: CarFront },
  { href: '/portal/book', label: 'Book a service', icon: CalendarPlus },
  { href: '/portal/invoices', label: 'Invoices', icon: FileText },
  { href: '/portal/profile', label: 'Profile', icon: User },
];

export function PortalShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await apiPost('/api/auth/logout', {}).catch(() => {});
    router.replace('/login');
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo href="/portal" />

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden items-center gap-2.5 rounded-xl border border-line py-1.5 pr-3 pl-1.5 sm:flex">
              <Avatar name={user.name} size="xs" />
              <div className="leading-tight">
                <p className="text-xs font-semibold text-ink">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] text-muted">Customer</p>
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-danger hover:text-danger"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex min-w-max gap-1 pb-2">
            {LINKS.map((l) => {
              const active = isActive(l.href, l.exact);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-soft text-brand'
                        : 'text-muted hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    <l.icon className="size-4" />
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-line py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-subtle sm:px-6">
          <p>© {new Date().getFullYear()} CyberAutoSuite</p>
          <Link href="/" className="hover:text-brand">
            Back to the public site
          </Link>
        </div>
      </footer>
    </div>
  );
}
