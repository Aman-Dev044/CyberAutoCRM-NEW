'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const REVIEWS = [
  {
    name: 'Patricia Olive',
    role: 'Owner · Honda City',
    rating: 5,
    text: 'Online booking and the reminder messages are the reason I stopped calling the garage. I picked a slot at 11pm and the confirmation was waiting in the morning.',
  },
  {
    name: 'John Duke',
    role: 'Fleet Manager · 12 vans',
    rating: 5,
    text: 'Having every vehicle history and part replacement in one place means my drivers never argue about what was done. The job card is the single source of truth.',
  },
  {
    name: 'Nicholas Fernandes',
    role: 'Owner · Hyundai Creta',
    rating: 5,
    text: 'I watched the status move from diagnosis to quality check on my phone. No calls, no guessing, and the invoice matched the estimate to the rupee.',
  },
  {
    name: 'Michael Warne',
    role: 'Service Advisor',
    rating: 4,
    text: 'From the counter side, the workshop board is the win. I can see every bay, who is on what, and what is stuck waiting on parts without walking the floor.',
  },
  {
    name: 'Meera Iyer',
    role: 'Owner · Nexon EV',
    rating: 5,
    text: 'They flagged my insurance expiry before I noticed it myself. That one reminder is worth more than any discount coupon.',
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % REVIEWS.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const go = (dir: number) => setIndex((i) => (i + dir + REVIEWS.length) % REVIEWS.length);
  const review = REVIEWS[index];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-card sm:p-12">
        <Quote className="absolute -top-2 right-6 size-24 text-brand/10" />

        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'size-4',
                i < review.rating ? 'fill-warning text-warning' : 'text-line-strong',
              )}
            />
          ))}
        </div>

        <blockquote className="mt-5 font-display text-lg leading-relaxed text-ink sm:text-xl">
          “{review.text}”
        </blockquote>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand/25 to-accent/25 font-bold text-brand">
              {review.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{review.name}</p>
              <p className="text-xs text-muted">{review.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className="grid size-9 place-items-center rounded-lg border border-line text-muted transition hover:border-brand hover:text-brand"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="grid size-9 place-items-center rounded-lg border border-line text-muted transition hover:border-brand hover:text-brand"
              aria-label="Next testimonial"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-1.5">
        {REVIEWS.map((r, i) => (
          <button
            key={r.name}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show testimonial ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === index ? 'w-7 bg-brand' : 'w-1.5 bg-line-strong hover:bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}
