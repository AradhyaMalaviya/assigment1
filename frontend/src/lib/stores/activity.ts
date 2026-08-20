import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ActivityType = 'started' | 'completed' | 'scheduled' | 'info';

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
}

const STORAGE_KEY = 'recentActivity';

function loadInitialActivities(): Activity[] {
  if (!browser) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore storage parse errors
  }
  return [];
}

const internalActivitiesStore = writable<Activity[]>(loadInitialActivities());

export const activities = {
  subscribe: internalActivitiesStore.subscribe,
  set: internalActivitiesStore.set,
  update: internalActivitiesStore.update,
  addActivity: (type: ActivityType, message: string) => {
    const newActivity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      timestamp: new Date().toISOString()
    };
    internalActivitiesStore.update((current) => {
      const updated = [newActivity, ...current].slice(0, 20);
      if (browser) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore storage persistence errors
        }
      }
      return updated;
    });
  },
  clear: () => {
    internalActivitiesStore.set([]);
    if (browser) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage clear errors
      }
    }
  }
};

export function addActivity(type: ActivityType, message: string) {
  activities.addActivity(type, message);
}
