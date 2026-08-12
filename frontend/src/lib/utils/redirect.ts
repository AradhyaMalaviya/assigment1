const FALLBACK_TARGET = '/dashboard';

/**
 * Resolves the `redirectTo` query parameter set by the (app) guard into a safe
 * post-login destination.
 *
 * The server-only counterpart that *builds* this parameter lives in
 * `$lib/server/session.ts`; SvelteKit forbids importing that module from client
 * code, so the pair is split across the boundary on purpose.
 */
export function resolveRedirectTarget(raw: string | null | undefined): string {
  if (!raw) return FALLBACK_TARGET;
  // Open-redirect guard: only same-origin paths. `//evil.com` is protocol-relative
  // and would navigate off-site despite starting with a slash.
  if (!raw.startsWith('/') || raw.startsWith('//')) return FALLBACK_TARGET;
  // Never bounce back into the auth group — that is how a redirect loop starts.
  if (raw.startsWith('/login') || raw.startsWith('/register')) return FALLBACK_TARGET;
  return raw;
}
