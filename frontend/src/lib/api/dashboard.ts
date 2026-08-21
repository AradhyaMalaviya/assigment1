import { request } from './client';
import type {
  ApiResponse,
  PollStatusResponse,
  DashboardDataResponse,
  BatchStatus
} from '$lib/types/api';

/**
 * Checks lightweight backend polling status from GET /dashboard/poll-status.
 * Returns whether polling is needed and the adaptive interval (3s, 10s, 30s).
 */
export async function getPollStatus(): Promise<PollStatusResponse> {
  return request<PollStatusResponse>('/dashboard/poll-status', {
    method: 'GET'
  });
}

/**
 * Fetches dashboard details (active batch summary and up to 5 scheduled jobs)
 * from GET /dashboard/data.
 */
export async function getDashboardData(): Promise<DashboardDataResponse> {
  return request<DashboardDataResponse>('/dashboard/data', {
    method: 'GET'
  });
}

/**
 * Retrieves the full active batch status and job details from GET /batch-status.
 */
export async function getBatchStatus(): Promise<ApiResponse<BatchStatus>> {
  return request<ApiResponse<BatchStatus>>('/batch-status', {
    method: 'GET'
  });
}

/**
 * Pauses the currently running batch job via POST /batch-pause.
 */
export async function pauseBatch(): Promise<ApiResponse<never>> {
  return request<ApiResponse<never>>('/batch-pause', {
    method: 'POST'
  });
}

/**
 * Resumes a paused batch job via POST /batch-resume.
 */
export async function resumeBatch(): Promise<ApiResponse<never>> {
  return request<ApiResponse<never>>('/batch-resume', {
    method: 'POST'
  });
}

/**
 * Cancels the currently active batch job via DELETE /batch-cancel.
 * Note: Must be DELETE, not POST.
 */
export async function cancelBatch(): Promise<ApiResponse<never>> {
  return request<ApiResponse<never>>('/batch-cancel', {
    method: 'DELETE'
  });
}
