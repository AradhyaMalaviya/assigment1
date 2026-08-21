import { error, redirect } from '@sveltejs/kit';
import { BackendUnreachableError, buildRedirectTarget, getSessionUser } from '$lib/server/session';
import type { User } from '$lib/types/api';
import type { LayoutServerLoad } from './$types';

/**
 * The guard for every protected route. Runs on the server so the session is resolved
 * before any protected markup is rendered — there is no authenticated-looking flash to
 * be corrected on hydration.
 *
 * The returned `user` is merged by SvelteKit into every descendant page's `data`, so
 * pages get `data.user` with no load function of their own.
 */
export const load: LayoutServerLoad = async ({ cookies, url, fetch }) => {
  let user: User | null;
  try {
    user = await getSessionUser(cookies, fetch);
  } catch (err) {
    // A backend outage is not a logout. Bouncing to /login here would tell the user
    // their session ended and hand them a form that cannot possibly succeed.
    if (err instanceof BackendUnreachableError)
      error(503, 'The server is temporarily unavailable. Please try again shortly.');
    throw err;
  }

  // Deliberately outside the try/catch above: both `redirect()` and `error()` work by
  // throwing, and a catch block would otherwise intercept the control flow they rely on.
  if (!user) redirect(302, buildRedirectTarget(url));

  return { user };
};
