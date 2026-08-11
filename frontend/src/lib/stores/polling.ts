import { writable } from 'svelte/store';

export const pollingInterval = writable<number | null>(null);
export const pollingTimer = writable<ReturnType<typeof setTimeout> | null>(null);
