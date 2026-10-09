import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE } from '@/lib/constants';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-insecure-secret-change-me-please-32chars',
);

const STAFF = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN'];

/**
 * Origins allowed to call the API with credentials. Only needed when the API
 * runs on a different port/host than the UI (e.g. API :2442, web :2552).
 * Comma-separated. Leave unset for a normal single-process deployment.
 */
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function applyCors(res: NextResponse, origin: string | null) {
  if (!origin || !ALLOWED_ORIGINS.includes(origin.replace(/\/+$/, ''))) return res;
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.append('Vary', 'Origin');
  return res;
}

async function readSession(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: 'cyberautosuite' });
    return payload as { id?: string; role?: string; name?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const origin = req.headers.get('origin');

  // ----------------------------------------------------------------- API
  // Route handlers do their own auth, so here we only deal with CORS.
  if (pathname.startsWith('/api')) {
    if (req.method === 'OPTIONS') {
      const preflight = new NextResponse(null, { status: 204 });
      preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      preflight.headers.set(
        'Access-Control-Allow-Headers',
        req.headers.get('access-control-request-headers') || 'Content-Type',
      );
      preflight.headers.set('Access-Control-Max-Age', '86400');
      return applyCors(preflight, origin);
    }
    return applyCors(NextResponse.next(), origin);
  }

  // ------------------------------------------------------------- app pages
  const session = await readSession(req);
  const role = session?.role;

  // Already signed in? Keep auth pages out of the way.
  if (session && (pathname === '/login' || pathname === '/register')) {
    const home = role && STAFF.includes(role) ? '/admin' : '/portal';
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (pathname.startsWith('/admin')) {
    if (!session) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }
    if (!role || !STAFF.includes(role)) {
      return NextResponse.redirect(new URL('/portal', req.url));
    }
  }

  if (pathname.startsWith('/portal')) {
    if (!session) {
      const url = new URL('/login', req.url);
      url.searchParams.set('next', pathname + search);
      return NextResponse.redirect(url);
    }
    // Staff peeking at the portal get sent to their own cockpit.
    if (role && STAFF.includes(role)) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/portal/:path*', '/login', '/register'],
};
