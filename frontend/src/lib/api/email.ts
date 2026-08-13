import { request } from './client';
import type { ParseExcelResponse, ProviderInfoResponse } from '$lib/types/api';

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
