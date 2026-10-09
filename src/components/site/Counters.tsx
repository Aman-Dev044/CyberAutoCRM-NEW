'use client';

import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils';

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (target <= 0) {
      setValue(0);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // ease-out cubic so the number settles rather than slamming to a stop
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}

export function Counters({
  items,
}: {
  items: { label: string; value: number; suffix?: string; decimals?: boolean }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Counter key={item.label} {...item} active={active} />
      ))}
    </div>
  );
}

function Counter({
  label,
  value,
  suffix,
  decimals,
  active,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: boolean;
  active: boolean;
}) {
  const scaled = decimals ? Math.round(value * 10) : value;
  const current = useCountUp(scaled, active);
  const shown = decimals ? (current / 10).toFixed(1) : formatNumber(current);

  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-5 text-center backdrop-blur">
      <p className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
        {shown}
        {suffix ? <span className="text-brand">{suffix}</span> : null}
      </p>
      <p className="mt-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}
