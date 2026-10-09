import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { Logo } from '@/components/site/Logo';

export default function NotFound() {
  return (
    <div className="hero-aura relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="grid-bg absolute inset-0 opacity-60" />
      <div className="relative">
        <Logo />
        <p className="mt-10 font-display text-7xl font-extrabold brand-gradient-text sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">
          This bay is empty
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          The page you were looking for has been moved, renamed, or never existed. Let us get you
          back on the road.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-contrast transition hover:brightness-110"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
          <Link
            href="/track"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong px-6 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            <Compass className="size-4" />
            Track a service
          </Link>
        </div>
      </div>
    </div>
  );
}
