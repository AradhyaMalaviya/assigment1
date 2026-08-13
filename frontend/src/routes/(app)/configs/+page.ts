import type { PageLoad } from './$types';
import { listConfigs } from '$lib/api/config';

export const load: PageLoad = async ({ fetch, depends }) => {
  // Named dependency: mutation handlers on this page call invalidate('app:configs')
  // instead of hand-rolling a second fetch-and-reassign path (Phase 5 item 10).
  depends('app:configs');
  return { configsResponse: await listConfigs(fetch) };
};
