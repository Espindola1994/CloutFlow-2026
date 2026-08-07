import { cookies } from 'next/headers';
import { validateSession } from '@/db/repositories/auth.repository';

export const SESSION_COOKIE_NAME = 'admin_session';

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  const result = await validateSession(sessionCookie.value);
  return result;
}

export async function requireUser() {
  const result = await getSession();
  if (!result) {
    throw new Error('Unauthorized');
  }
  return result.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}
