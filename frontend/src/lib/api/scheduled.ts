import { request } from '$lib/api/client';
import type { ApiResponse, ScheduledJob } from '$lib/types/api';

/**
 * Retrieves all currently scheduled and running email jobs across all users.
 * Backend contract: GET /scheduled-jobs -> { success: true, data: ScheduledJob[] }
 */
export async function getScheduledJobs(): Promise<ApiResponse<ScheduledJob[]>> {
  return request<ApiResponse<ScheduledJob[]>>('/scheduled-jobs', {
    method: 'GET'
  });
}

/**
 * Cancels a scheduled email job by its ID.
 * Backend contract: DELETE /scheduled-jobs/:id -> { success: true, message: string }
 * Note: Returns 404 if the job is already in 'running' status or not found.
 */
export async function cancelScheduledJob(jobId: string): Promise<ApiResponse<void>> {
  return request<ApiResponse<void>>(`/scheduled-jobs/${encodeURIComponent(jobId)}`, {
    method: 'DELETE'
  });
}
