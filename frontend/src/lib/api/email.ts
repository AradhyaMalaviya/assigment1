import { request } from './client';
import type { ParseExcelResponse, ProviderInfoResponse, SendResponse } from '$lib/types/api';

/**
 * Sends an Excel file (.xlsx) to POST /parse-excel to validate headers, skip invalid email rows,
 * and return the first five parsed contacts plus the total contact count.
 */
export async function parseExcel(file: File): Promise<ParseExcelResponse> {
  const formData = new FormData();
  formData.append('excelFile', file);

  return request<ParseExcelResponse>('/parse-excel', {
    method: 'POST',
    body: formData
    // Note: Do NOT set Content-Type header manually for FormData.
  });
}

/**
 * Requests provider limits and guidance from POST /provider-info.
 */
export async function getProviderInfo(
  smtpHost: string,
  hasNotification: boolean = false
): Promise<ProviderInfoResponse> {
  const formData = new FormData();
  formData.append('smtpHost', smtpHost);
  formData.append('hasNotification', hasNotification ? 'true' : 'false');

  return request<ProviderInfoResponse>('/provider-info', {
    method: 'POST',
    body: formData
  });
}

/**
 * Submits the 16-field campaign delivery payload to POST /send.
 * Returns the discriminated SendResponse (Immediate, Batch, or Scheduled).
 */
export async function sendEmails(formData: FormData): Promise<SendResponse> {
  return request<SendResponse>('/send', {
    method: 'POST',
    body: formData
    // Note: Do NOT set Content-Type header manually for FormData.
  });
}

/**
 * Sends a test notification to POST /test-notification with JSON { testEmail }.
 */
export async function testNotification(
  testEmail: string
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/test-notification', {
    method: 'POST',
    body: JSON.stringify({ testEmail })
  });
}
