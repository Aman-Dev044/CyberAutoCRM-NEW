import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';

const SERVICE_LINKS = [
  { href: '/services#maintenance', label: 'Periodic Maintenance' },
  { href: '/services#diagnostics', label: 'Engine Diagnostics' },
  { href: '/services#repair', label: 'Mechanical Repair' },
  { href: '/services#detailing', label: 'Detailing & Coating' },
  { href: '/services#electrical', label: 'EV & Electricals' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/book', label: 'Book a Service' },
  { href: '/track', label: 'Track Your Car' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'CRM Login' },
];

export function SiteFooter({
  garage,
}: {
  garage?: { name?: string; phone?: string; email?: string; address?: string } | null;
}) {
  const phone = garage?.phone ?? '+91 98765 43210';
  const email = garage?.email ?? 'info@cyberautosuite.com';
  const address = garage?.address ?? 'Plot 14, Industrial Area Phase 2, Chandigarh 160002';

  return (
    <footer className="relative mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            The co-pilot for modern service centers — bookings, job cards, inventory and invoicing
            in one cockpit your customers can follow live.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold tracking-[0.14em] text-subtle uppercase">Services</h4>
          <ul className="mt-4 space-y-2.5">
            {SERVICE_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-muted transition-colors hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold tracking-[0.14em] text-subtle uppercase">Company</h4>
          <ul className="mt-4 space-y-2.5">
            {COMPANY_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-muted transition-colors hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold tracking-[0.14em] text-subtle uppercase">Reach us</h4>
          <ul className="mt-4 space-y-3.5 text-sm text-muted">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>{address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand" />
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-brand">
                {phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand" />
              <a href={`mailto:${email}`} className="hover:text-brand">
                {email}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>
                Mon–Sat 09:00–19:00
                <br />
                Sun 09:00–14:00
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-subtle sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {garage?.name ?? 'CyberAutoSuite'}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Built with Next.js, MongoDB &amp; a lot of coffee
          </p>
        </div>
      </div>
    </footer>
  );
}
