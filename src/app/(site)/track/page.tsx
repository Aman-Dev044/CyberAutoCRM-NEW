import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TrackForm } from '@/components/site/TrackForm';

export const metadata: Metadata = {
  title: 'Track Your Service',
  description:
    'Enter your booking or job card reference to see live progress, timeline and billing status.',
};

export default function TrackPage() {
  return (
    <div className="hero-aura relative">
      <div className="grid-bg absolute inset-0 h-72 opacity-60" />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-brand uppercase">
            Live status
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold text-ink sm:text-5xl">
            Where is my car?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted">
            Enter the reference from your booking confirmation or printed job card. No login
            needed.
          </p>
        </div>

        <div className="mt-10">
          <Suspense
            fallback={<div className="skeleton h-14 rounded-xl" />}
          >
            <TrackForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
