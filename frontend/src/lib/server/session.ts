import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import type { User } from '$lib/types/api';

/**
 * Server-only session resolution shared by both route guards.
 *
 * Living under `$lib/server/` is load-bearing, not stylistic: SvelteKit fails the build
 * if this module is ever imported from client code, which is the protection this file
 * needs because it reads BACKEND_ORIGIN — a private env var the browser has no business
 * knowing (ADR 0001 §5.1).
 *
 * Per ADR 0001, the guard calls the backend *directly* rather than through this app's
 * own /api proxy, which would be a pointless self-request.
 */

const SESSION_COOKIE = 'session_token';

/** Raised when the backend could not answer at all — distinct from it answering "no". */
export class BackendUnreachableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'BackendUnreachableError';
  }
}

type LoadFetch = typeof globalThis.fetch;

/**
 * Resolves the caller's session into one of three outcomes the two guards need to treat
 * differently:
 *
 * - `null` from a missing cookie, or from a cookie the backend rejected (401) — the
 *   stale cookie is dropped so the browser stops presenting it.
 * - a `User`, when the session is live.
 * - a thrown `BackendUnreachableError`, when the backend is down. Collapsing this into
 *   `null` would log a user out because a server restarted, and would hide an outage
 *   behind a login page.
 */
export async function getSessionUser(cookies: Cookies, fetch: LoadFetch): Promise<User | null> {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null; // No credential to check — no round trip needed.

  const backendOrigin = env.BACKEND_ORIGIN;
  // A misconfigured server is a deployment bug, not a transient outage: let it surface
  // as a 500 rather than a "temporarily unavailable" that will never resolve itself.
  if (!backendOrigin) throw new Error('BACKEND_ORIGIN is not configured on the SvelteKit server.');

  let response: Response;
  try {
    response = await fetch(new URL('/auth/me', backendOrigin), {
      // The Cookie header is set by hand because SvelteKit's load-fetch only forwards
      // the browser's cookies to same-origin/relative URLs, never to an absolute
      // cross-origin one like the backend.
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    });
  } catch (cause) {
    throw new BackendUnreachableError('The backend did not respond.', { cause });
  }

  if (response.status === 401) {
    // The backend's own Set-Cookie clearing header cannot reach the browser from a
    // server-to-server call, so the expired cookie is dropped on this hop instead.
    cookies.delete(SESSION_COOKIE, { path: '/' });
    return null;
  }
  if (!response.ok)
    throw new BackendUnreachableError(`The backend answered /auth/me with ${response.status}.`);

  let payload: { user?: User };
  try {
    payload = (await response.json()) as { user?: User };
  } catch (cause) {
    throw new BackendUnreachableError('The backend returned a malformed /auth/me body.', { cause });
  }
  if (!payload?.user)
    throw new BackendUnreachableError('The backend returned no user on a successful /auth/me.');
  return payload.user;
}

/** Builds the login URL that sends the visitor back where they were headed. */
export function buildRedirectTarget(url: URL): string {
  return `/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`;
}
