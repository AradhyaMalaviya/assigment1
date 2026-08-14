import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getPollStatus } from '$lib/api/dashboard';
import type { PollStatus } from '$lib/types/api';

export const isPolling = writable<boolean>(false);
export const pollInterval = writable<number | null>(null);
export const lastPolled = writable<Date | null>(null);
export const pollStatus = writable<PollStatus | null>(null);
export const serviceDegraded = writable<string | null>(null);
export const isFetching = writable<boolean>(false);

// Internal timer reference
let timerHandle: ReturnType<typeof setTimeout> | null = null;
let isPollingActive = false;
let currentPollCallback: (() => Promise<void>) | null = null;
let pollSequence = 0;

/**
 * Clears any pending polling timers.
 */
function clearTimer() {
  if (timerHandle !== null) {
    clearTimeout(timerHandle);
    timerHandle = null;
  }
}

/**
 * Performs a single adaptive poll cycle:
 * 1. Checks GET /dashboard/poll-status.
 * 2. If pollNeeded is true, invokes onDataNeeded callback (e.g. to fetch /dashboard/data and /batch-status).
 * 3. Schedules next poll with the exact interval returned by backend (3s, 10s, 30s).
 * 4. If pollNeeded is false, stops timer and leaves dashboard in idle state.
 */
async function executePollCycle(): Promise<void> {
  if (!browser || !isPollingActive) return;

  const sequence = ++pollSequence;
  clearTimer();
  isFetching.set(true);

  try {
    const res = await getPollStatus();

    // Guard against stale response if stopped or a new poll started
    if (!isPollingActive || sequence !== pollSequence) return;

    const data = res.data;
    if (!data) {
      isPolling.set(false);
      pollInterval.set(null);
      return;
    }

    pollStatus.set(data);
    lastPolled.set(new Date());
    serviceDegraded.set(data.error || null);

    if (data.pollNeeded) {
      isPolling.set(true);
      pollInterval.set(data.pollInterval);

      // Invoke consumer callback to fetch details if work exists
      if (currentPollCallback) {
        try {
          await currentPollCallback();
        } catch (callbackErr) {
          console.warn('Dashboard data fetch warning:', callbackErr);
        }
      }

      // Schedule next poll cycle after backend-dictated interval
      if (isPollingActive && sequence === pollSequence) {
        clearTimer();
        timerHandle = setTimeout(() => {
          void executePollCycle();
        }, data.pollInterval);
      }
    } else {
      // Backend says no polling needed -> idle state, zero continued requests
      isPolling.set(false);
      pollInterval.set(null);
    }
  } catch (err) {
    if (!isPollingActive || sequence !== pollSequence) return;
    console.warn('Poll status error:', err);
    serviceDegraded.set(err instanceof Error ? err.message : 'Failed to reach polling service');
    isPolling.set(false);
    pollInterval.set(null);
  } finally {
    if (sequence === pollSequence) {
      isFetching.set(false);
    }
  }
}

/**
 * Starts adaptive polling for the dashboard with the provided data refresh callback.
 */
export function startAdaptivePolling(onDataNeeded?: () => Promise<void>): void {
  if (!browser) return;

  stopAdaptivePolling();
  isPollingActive = true;
  currentPollCallback = onDataNeeded || null;

  // Perform immediate initial check
  void executePollCycle();
}

/**
 * Immediately triggers a fresh state check (e.g. after a campaign is created or batch paused/resumed).
 */
export function triggerStateCheck(): void {
  if (!browser || !isPollingActive) return;
  void executePollCycle();
}

/**
 * Completely stops adaptive polling and cleans up all active timers.
 */
export function stopAdaptivePolling(): void {
  isPollingActive = false;
  currentPollCallback = null;
  pollSequence++;
  clearTimer();
  isPolling.set(false);
  isFetching.set(false);
  pollInterval.set(null);
}
