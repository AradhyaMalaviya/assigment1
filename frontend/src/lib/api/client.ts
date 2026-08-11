import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { clearAuth } from '$lib/stores/auth';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope = { success?: boolean; message?: string };
type RequestBody = BodyInit | null | undefined;
type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: RequestBody;
  headers?: HeadersInit;
};

const apiBase = env.PUBLIC_API_BASE_URL || '/api';

function requestUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase.replace(/\/$/, '')}${normalizedPath}`;
}

function isFormData(body: RequestBody): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}
function isJsonBody(body: RequestBody): body is string {
  return typeof body === 'string';
}

function readMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  )
    return payload.message;
  return fallback;
}

function handleUnauthorized(path: string) {
  if (!browser || path === '/auth/me') return;
  clearAuth();
  if (window.location.pathname !== '/login')
    void goto(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
}

export async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (isJsonBody(options.body) && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  // FormData deliberately reaches the browser unchanged so it creates the multipart boundary.
  if (isFormData(options.body)) headers.delete('Content-Type');
  const response = await fetch(requestUrl(path), { ...options, headers, credentials: 'include' });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  const envelope = payload as ApiEnvelope | undefined;
  if (!response.ok || envelope?.success === false) {
    handleUnauthorized(path);
    throw new ApiError(
      response.status,
      readMessage(payload, response.statusText || 'Request failed'),
      payload,
    );
  }
  return payload as T;
}

export async function getBlob(
  path: string,
  options: Omit<ApiRequestOptions, 'body'> = {},
): Promise<Blob> {
  const response = await fetch(requestUrl(path), { ...options, credentials: 'include' });
  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    handleUnauthorized(path);
    throw new ApiError(
      response.status,
      readMessage(payload, response.statusText || 'Request failed'),
      payload,
    );
  }
  return response.blob();
}
