import { request } from './client';
import type { ActiveSmtpConfigResponse, SmtpConfigListResponse } from '$lib/types/api';
import type { SmtpConfigForm, SmtpTestPayload } from '$lib/types/forms';

/** GET /config/smtp. Accepts an optional fetch so a +page.ts load can pass SvelteKit's
 *  own cookie-aware fetch through this module instead of bypassing it. */
export async function listConfigs(fetchImpl?: typeof fetch): Promise<SmtpConfigListResponse> {
  return request<SmtpConfigListResponse>('/config/smtp', {}, fetchImpl);
}

/** POST /config/smtp. The response's `data` echoes the row in snake_case
 *  (config.ts:79-89,116) — deliberately untyped and unused here; the create flow always
 *  refetches userConfigs[] afterwards, so only configId matters. */
export async function createConfig(payload: SmtpConfigForm): Promise<{ configId: string }> {
  return request('/config/smtp', { method: 'POST', body: JSON.stringify(payload) });
}

/** PUT /config/smtp/:configId. Callers must omit `pass` entirely (not send an empty
 *  string) unless the user actually typed a new password — see ConfigForm.svelte. */
export async function updateConfig(configId: string, payload: Partial<SmtpConfigForm>): Promise<void> {
  await request(`/config/smtp/${configId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteConfig(configId: string): Promise<void> {
  await request(`/config/smtp/${configId}`, { method: 'DELETE' });
}

export async function setDefaultConfig(configId: string): Promise<void> {
  await request(`/config/smtp/${configId}/default`, { method: 'POST' });
}

/** POST /config/smtp/test. request() throws on success:false, so a resolved promise
 *  here only ever represents an actual passing test — a failing test is caught by the
 *  caller as an ApiError and its .message rendered as the failure reason. */
export async function testSmtpConnection(payload: SmtpTestPayload): Promise<{ success: true; message: string }> {
  return request('/config/smtp/test', { method: 'POST', body: JSON.stringify(payload) });
}

/** GET /config/smtp/active. Not called by this phase's own UI (see scope note) — built
 *  now because it's one of the "seven endpoints" this module owns, and Phase 6's
 *  ConfigSelector needs exactly this shape. */
export async function getActiveConfig(): Promise<ActiveSmtpConfigResponse> {
  return request('/config/smtp/active');
}
