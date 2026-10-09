'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronsLeft,
  ExternalLink,
  LogOut,
  Menu,
  PanelLeftClose,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import { can } from '@/lib/rbac';
import { apiPost } from '@/lib/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/site/Logo';
import { NAV } from './nav';

export type ShellUser = { id: string; name: string; email: string; role: Role };

export type ShellBadges = { messages?: number; lowStock?: number; activeJobs?: number };

export function AdminShell({
  user,
  badges = {},
  children,
}: {
  user: ShellUser;
  badges?: ShellBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('cas-sidebar') === 'collapsed');
    } catch {
      /* storage unavailable — default to expanded */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem('cas-sidebar', next ? 'collapsed' : 'expanded');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const signOut = async () => {
    await apiPost('/api/auth/logout', {}).catch(() => {});
    router.replace('/login');
    router.refresh();
  };

  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => can(user.role, i.permission)),
  })).filter((g) => g.items.length);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-text">
      <div
        className={cn(
          'flex h-18 shrink-0 items-center border-b border-white/5 px-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {collapsed ? (
          <Logo href="/admin" compact />
        ) : (
          <>
            <Logo href="/admin" tone="light" />
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden rounded-lg p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white lg:block"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="size-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            {!collapsed ? (
              <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-white/30 uppercase">
                {group.title}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const badge = item.badge ? badges[item.badge] : undefined;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        collapsed && 'justify-center px-0',
                        active
                          ? 'bg-[var(--sidebar-active)] text-white'
                          : 'text-white/55 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      {active ? (
                        <span className="absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-r bg-brand" />
                      ) : null}
                      <item.icon
                        className={cn('size-4.5 shrink-0', active && 'text-brand')}
                      />
                      {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                      {badge ? (
                        <span
                          className={cn(
                            'rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-contrast',
                            collapsed && 'absolute top-1 right-1 px-1',
                          )}
                        >
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/5 p-3">
        {collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mx-auto grid size-9 place-items-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Expand sidebar"
          >
            <PanelLeftClose className="size-4 rotate-180" />
          </button>
        ) : (
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="size-4" />
            View public site
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-200 lg:block',
          collapsed ? 'w-18' : 'w-68',
        )}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw] shadow-pop">
            {sidebar}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 -right-11 grid size-9 place-items-center rounded-lg bg-surface text-ink"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-18 shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 place-items-center rounded-xl border border-line text-ink lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-2">
            {can(user.role, 'appointment:create') ? (
              <Link
                href="/admin/appointments?new=1"
                className="hidden h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-semibold text-brand-contrast transition hover:brightness-110 sm:inline-flex"
              >
                <Plus className="size-4" />
                New booking
              </Link>
            ) : null}

            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl border border-line py-1.5 pr-2 pl-1.5 transition hover:border-brand/40"
                aria-expanded={menuOpen}
              >
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand/25 to-accent/25 text-xs font-bold text-brand">
                  {initials(user.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold text-ink">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="block text-[10px] text-muted">{ROLE_LABELS[user.role]}</span>
                </span>
              </button>

              {menuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-hidden
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                      <p className="mt-1.5 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                        {ROLE_LABELS[user.role]}
                      </p>
                    </div>
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition hover:bg-surface-2"
                    >
                      <User className="size-4 text-muted" />
                      My profile
                    </Link>
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-sm text-danger transition hover:bg-danger-soft"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

/** Jumps straight to the right list page with the query pre-applied. */
function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    const upper = q.toUpperCase();
    if (upper.startsWith('JOB-')) router.push(`/admin/orders?q=${encodeURIComponent(q)}`);
    else if (upper.startsWith('APT-')) router.push(`/admin/appointments?q=${encodeURIComponent(q)}`);
    else if (upper.startsWith('INV-')) router.push(`/admin/invoices?q=${encodeURIComponent(q)}`);
    else router.push(`/admin/customers?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={submit} className="relative hidden max-w-sm flex-1 md:block">
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search customer, JOB-, APT- or INV-…"
        className="h-10 w-full rounded-xl border border-line bg-surface-2/60 pr-3 pl-9 text-sm text-ink placeholder:text-subtle focus:border-brand focus:bg-surface focus:outline-none"
        aria-label="Global search"
      />
    </form>
  );
}
