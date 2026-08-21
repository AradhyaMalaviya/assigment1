import { env } from '$env/dynamic/private';
import { error, type RequestHandler } from '@sveltejs/kit';

const responseHeadersToDrop = new Set(['content-encoding', 'content-length', 'transfer-encoding']);

const proxy: RequestHandler = async ({ request, url, params }) => {
  const backendOrigin = env.BACKEND_ORIGIN;
  if (!backendOrigin) error(500, 'BACKEND_ORIGIN is not configured on the SvelteKit server.');

  const upstreamUrl = new URL(`/${params.path}`, backendOrigin);
  upstreamUrl.search = url.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  // Use the actual browser-facing protocol. In local HTTP this remains http, preserving non-Secure session cookies.
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
  headers.set('x-forwarded-host', url.host);

  const requestInit: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  };
  if (requestInit.body) requestInit.duplex = 'half';

  const forward = globalThis.fetch;
  const upstream = await forward(upstreamUrl, requestInit);
  const outgoingHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!responseHeadersToDrop.has(key.toLowerCase()) && key.toLowerCase() !== 'set-cookie')
      outgoingHeaders.append(key, value);
  });
  const setCookies =
    (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  for (const cookie of setCookies) outgoingHeaders.append('set-cookie', cookie);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outgoingHeaders,
  });
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
