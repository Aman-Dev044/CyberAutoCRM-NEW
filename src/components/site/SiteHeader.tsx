'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Gauge, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from './Logo';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/track', label: 'Track Service' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader({ signedIn = false, homeHref = '/login' }: { signedIn?: boolean; homeHref?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-all duration-300',
        scrolled
          ? 'border-line bg-surface/85 backdrop-blur-xl shadow-card'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  active ? 'text-brand' : 'text-muted hover:text-ink',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          <Link
            href={signedIn ? homeHref : '/login'}
            className="hidden h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand sm:inline-flex"
          >
            <Gauge className="size-4" />
            {signedIn ? 'My Dashboard' : 'CRM Login'}
          </Link>
          <Link
            href="/book"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-contrast transition hover:brightness-110"
          >
            Book Service
            <ArrowRight className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-xl border border-line text-ink lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface px-4 py-3 lg:hidden">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-2"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={signedIn ? homeHref : '/login'}
              className="mt-2 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-semibold text-ink"
            >
              {signedIn ? 'My Dashboard' : 'CRM Login'}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
