import { request } from './client';
import { clearAuth, setAuthUser } from '$lib/stores/auth';
import type { User } from '$lib/types/api';
import type { LoginForm, RegisterForm } from '$lib/types/forms';

/**
 * The auth endpoints put `user` at the top level of the response rather than inside
 * `ApiResponse<T>.data`, so these shapes stay local to this module instead of joining
 * the shared envelope types in `$lib/types/api.ts`.
 */
interface AuthUserResponse {
  success: true;
  message?: string;
  user: User;
}

/**
 * Each call that establishes or confirms a session also updates the auth store.
 * Ownership of that mutation lives here, matching the precedent in `client.ts` where
 * `handleUnauthorized()` clears the store on a 401 — and it removes a bug class where a
 * caller that forgets to update the store leaves the app authenticated by cookie but
 * logged out in the UI.
 */
export async function login(form: LoginForm): Promise<User> {
  const { user } = await request<AuthUserResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(form),
  });
  setAuthUser(user);
  return user;
}

export async function register(form: RegisterForm): Promise<User> {
  const { user } = await request<AuthUserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(form),
  });
  setAuthUser(user);
  return user;
}

/**
 * `clearAuth()` runs in `finally` so the UI logs out even when the network call fails.
 * That is self-healing rather than lossy: if the request never reached the backend the
 * cookie is still valid there, and the next server guard check simply re-authenticates
 * from it instead of leaving the user stuck in a half-logged-out shell.
 */
export async function logout(): Promise<void> {
  try {
    await request<{ success: true; message: string }>('/auth/logout', { method: 'POST' });
  } finally {
    clearAuth();
  }
}

/**
 * Not on this phase's control-flow path: the route guards resolve the session
 * server-side via `$lib/server/session.ts`, calling BACKEND_ORIGIN directly rather than
 * round-tripping through this app's own /api proxy (ADR 0001). Kept as the single place
 * for any future client-triggered session recheck.
 */
export async function me(): Promise<User> {
  const { user } = await request<AuthUserResponse>('/auth/me');
  setAuthUser(user);
  return user;
}
