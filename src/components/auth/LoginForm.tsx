'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiPost, fieldErrors, type ApiClientError } from '@/lib/client';

const DEMO = [
  { label: 'Super Admin', email: 'superadmin@cyberautosuite.com', password: 'SuperAdmin@123' },
  { label: 'Admin', email: 'admin@cyberautosuite.com', password: 'Admin@123' },
  { label: 'Manager', email: 'manager@cyberautosuite.com', password: 'Manager@123' },
  { label: 'Technician', email: 'gurpreet.tech@cyberautosuite.com', password: 'Tech@123' },
  { label: 'Customer', email: 'customer@cyberautosuite.com', password: 'Customer@123' },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const data = await apiPost<{ redirectTo: string; user: { name: string } }>(
        '/api/auth/login',
        { email, password },
      );
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
      const next = params.get('next');
      router.replace(next && next.startsWith('/') ? next : data.redirectTo);
      router.refresh();
    } catch (err) {
      const e2 = err as ApiClientError;
      setErrors(fieldErrors(e2.details));
      toast.error('Sign in failed', e2.message);
      setLoading(false);
    }
  };

  const fillDemo = (d: (typeof DEMO)[number]) => {
    setEmail(d.email);
    setPassword(d.password);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Staff and customers use the same door — you land on the right dashboard automatically.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="Email address" required error={errors.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@cyberautosuite.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Password" required error={errors.password}>
          <div className="relative">
            <Input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition hover:text-ink"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          <LogIn className="size-4" />
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New customer?{' '}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-10 rounded-2xl border border-line bg-surface-2/50 p-4">
        <p className="text-xs font-bold tracking-wide text-subtle uppercase">Demo logins</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => fillDemo(d)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand"
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-subtle">
          Tap a role to fill the form. Seeded by <code className="text-brand">npm run seed</code>.
        </p>
      </div>
    </div>
  );
}
