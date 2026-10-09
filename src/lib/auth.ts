import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { AUTH_COOKIE, type Role } from './constants';

const secretString = process.env.JWT_SECRET || 'dev-insecure-secret-change-me-please-32chars';
const secret = new TextEncoder().encode(secretString);
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  customerId?: string | null;
  avatarUrl?: string | null;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 11);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('cyberautosuite')
    .setExpirationTime(EXPIRES_IN)
    .sign(secret);
}

export async function verifySession(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: 'cyberautosuite' });
    if (!payload?.id || !payload?.role) return null;
    return {
      id: String(payload.id),
      name: String(payload.name ?? ''),
      email: String(payload.email ?? ''),
      role: payload.role as Role,
      customerId: payload.customerId ? String(payload.customerId) : null,
      avatarUrl: payload.avatarUrl ? String(payload.avatarUrl) : null,
    };
  } catch {
    return null;
  }
}

/** Reads the signed-in user from the request cookie. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(AUTH_COOKIE)?.value);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}
