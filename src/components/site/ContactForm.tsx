'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, FormRow, Input, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiPost, fieldErrors, type ApiClientError } from '@/lib/client';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await apiPost('/api/public/contact', form);
      toast.success('Message sent', 'Our service desk replies within one working day.');
      setForm(EMPTY);
    } catch (err) {
      const e2 = err as ApiClientError;
      setErrors(fieldErrors(e2.details));
      toast.error('Could not send your message', e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormRow>
        <Field label="Your name" required error={errors.name}>
          <Input value={form.name} onChange={set('name')} placeholder="Rohit Malhotra" required />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            required
          />
        </Field>
      </FormRow>

      <FormRow>
        <Field label="Phone" error={errors.phone}>
          <Input value={form.phone} onChange={set('phone')} placeholder="98765 43210" />
        </Field>
        <Field label="Subject" required error={errors.subject}>
          <Input
            value={form.subject}
            onChange={set('subject')}
            placeholder="AC service enquiry"
            required
          />
        </Field>
      </FormRow>

      <Field label="Message" required error={errors.message}>
        <Textarea
          value={form.message}
          onChange={set('message')}
          rows={5}
          placeholder="Tell us about your car and what it needs…"
          required
        />
      </Field>

      <Button type="submit" loading={loading} className="w-full sm:w-auto">
        <Send className="size-4" />
        Send message
      </Button>
    </form>
  );
}
