import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE } from '@/lib/constants';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-insecure-secret-change-me-please-32chars',
);

const STAFF = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN'];

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
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/register'],
};
