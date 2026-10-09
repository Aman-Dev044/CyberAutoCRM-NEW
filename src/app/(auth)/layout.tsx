import Link from 'next/link';
import { ArrowLeft, BarChart3, Radar, ShieldCheck, Wrench } from 'lucide-react';
import { Logo } from '@/components/site/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const HIGHLIGHTS = [
  { icon: Wrench, text: 'Digital job cards with a timestamped work log' },
  { icon: Radar, text: 'Live status your customers can follow themselves' },
  { icon: BarChart3, text: 'Revenue, technician and service-mix analytics' },
  { icon: ShieldCheck, text: 'Role-based access with a full audit trail' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="hero-aura relative hidden overflow-hidden border-r border-line bg-surface-2/40 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grid-bg absolute inset-0 opacity-70" />
        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-ink">
            The cockpit for your{' '}
            <span className="brand-gradient-text">whole workshop</span>.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Bookings, job cards, parts, invoices and insights — one place, scoped to the person
            signing in.
          </p>

          <ul className="mt-9 space-y-3.5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <h.icon className="size-4.5" />
                </span>
                <span className="pt-2 text-sm text-ink">{h.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-subtle">
          © {new Date().getFullYear()} CyberAutoSuite · Built with Next.js &amp; MongoDB
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-brand"
          >
            <ArrowLeft className="size-4" />
            Back to site
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
