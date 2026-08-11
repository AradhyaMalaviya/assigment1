import { writable } from 'svelte/store';

export type Activity = {
  id: string;
  type: 'started' | 'completed' | 'info';
  message: string;
  timestamp: string;
};
export const activities = writable<Activity[]>([]);
