'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] unhandled error', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="size-8" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        {error.message || 'An unexpected error interrupted this page.'}
        {error.digest ? (
          <span className="mt-2 block font-mono text-xs text-subtle">ref {error.digest}</span>
        ) : null}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-contrast transition hover:brightness-110"
        >
          <RotateCcw className="size-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-xl border border-line-strong px-6 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          Back to home
        </Link>
      </div>

      <p className="mt-10 max-w-sm text-xs leading-relaxed text-subtle">
        If this keeps happening, the database connection is the usual suspect — check{' '}
        <code className="text-brand">MONGODB_URI</code> in your environment.
      </p>
    </div>
  );
}
