'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, FormRow, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiPost, fieldErrors, type ApiClientError } from '@/lib/client';

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await apiPost('/api/auth/register', form);
      toast.success('Account created', 'Welcome to CyberAutoSuite.');
      router.replace('/portal');
      router.refresh();
    } catch (err) {
      const e2 = err as ApiClientError;
      setErrors(fieldErrors(e2.details));
      toast.error('Could not create your account', e2.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        Book services, add your vehicles and follow every job card from your phone.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="Full name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={set('name')}
            placeholder="Rohit Malhotra"
            autoComplete="name"
            required
          />
        </Field>

        <FormRow>
          <Field label="Email address" required error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Mobile number" required error={errors.phone}>
            <Input
              value={form.phone}
              onChange={set('phone')}
              placeholder="98765 43210"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </Field>
        </FormRow>

        <Field
          label="Password"
          required
          error={errors.password}
          hint="At least 8 characters."
        >
          <div className="relative">
            <Input
              type={show ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              autoComplete="new-password"
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
          <UserPlus className="size-4" />
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in instead
        </Link>
      </p>

      <p className="mt-8 text-center text-xs leading-relaxed text-subtle">
        Staff accounts are created by an administrator inside the CRM, not here.
      </p>
    </div>
  );
}
