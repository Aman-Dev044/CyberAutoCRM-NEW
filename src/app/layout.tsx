import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CyberAutoSuite — Auto Service CRM & Workshop Platform',
    template: '%s · CyberAutoSuite',
  },
  description:
    'CyberAutoSuite is an advanced CRM for car service centers: online booking, job cards, live service tracking, parts inventory, invoicing and analytics.',
  keywords: [
    'auto service CRM',
    'garage management software',
    'workshop management',
    'car service booking',
    'job card software',
  ],
  authors: [{ name: 'CyberAutoSuite' }],
  openGraph: {
    title: 'CyberAutoSuite — Auto Service CRM & Workshop Platform',
    description:
      'Run your whole workshop from one cockpit: bookings, job cards, inventory, invoices and insights.',
    type: 'website',
    siteName: 'CyberAutoSuite',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#060a12' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Applied before paint so the stored theme never flashes the wrong palette.
const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem('cas-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : true;
    if (stored === null && !prefersDark) dark = true;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-bg text-ink antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
