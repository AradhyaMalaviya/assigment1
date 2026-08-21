import { request, getBlob } from '$lib/api/client';
import type { ApiResponse, ReportResponse } from '$lib/types/api';

/**
 * Retrieves all email delivery logs and summary statistics.
 * Backend contract: GET /report -> { success: true, data: { logs: EmailLog[], stats: ReportStats } }
 */
export async function getReport(): Promise<ReportResponse> {
  return request<ReportResponse>('/report', {
    method: 'GET'
  });
}

/**
 * Exports all delivery logs as a CSV file attachment.
 * Backend contract: GET /report/export/csv -> text/csv with Content-Disposition: attachment; filename="email-logs.csv"
 */
export async function exportReportCsv(): Promise<Blob> {
  return getBlob('/report/export/csv', {
    method: 'GET'
  });
}

/**
 * Exports all delivery logs as a JSON file attachment.
 * Backend contract: GET /report/export/json -> application/json with Content-Disposition: attachment; filename="email-logs.json"
 */
export async function exportReportJson(): Promise<Blob> {
  return getBlob('/report/export/json', {
    method: 'GET'
  });
}

/**
 * Clears all email logs from the backend.
 * Backend contract: DELETE /report/clear -> { success: true, message: string }
 * Note: Irreversible destructive operation.
 */
export async function clearReportLogs(): Promise<ApiResponse<void>> {
  return request<ApiResponse<void>>('/report/clear', {
    method: 'DELETE'
  });
}
