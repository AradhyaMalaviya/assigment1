import { redirect } from '@sveltejs/kit';
import { BackendUnreachableError, getSessionUser } from '$lib/server/session';
import type { User } from '$lib/types/api';
import type { LayoutServerLoad } from './$types';

/**
 * The inverse guard: an already-authenticated visitor who lands on /login or /register
 * is sent to the app instead, matching the old `public/login.html` checkAuth() behaviour
 * (detailedplan.md §5.4).
 *
 * Two asymmetries versus the (app) guard, both load-bearing:
 *
 * 1. A backend outage does not error here. No protected content is at risk on a login
 *    page, and blocking the only route back into the app while the backend is briefly
 *    down is strictly worse than rendering the form and letting the submit surface the
 *    real network error.
 * 2. It redirects when a user *is* present — the opposite test — and only ever into the
 *    other route group. That is precisely what makes a redirect loop impossible: a loop
 *    needs a guard that redirects into its own group, and neither guard does. (Were this
 *    to redirect on `!user` like the (app) guard, visiting /login while logged out would
 *    bounce to /login forever.)
 */
export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  let user: User | null;
  try {
    user = await getSessionUser(cookies, fetch);
  } catch (err) {
    if (err instanceof BackendUnreachableError) return {};
    throw err;
  }

  if (user) redirect(302, '/dashboard');

  return {};
};
