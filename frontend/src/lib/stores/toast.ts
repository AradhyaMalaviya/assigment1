import { writable } from 'svelte/store';
import type { ToastItem } from '$lib/components/ui/Toast.svelte';

export const toasts = writable<ToastItem[]>([]);

export function dismissToast(id: string) {
  toasts.update((items) => items.filter((item) => item.id !== id));
}
export function addToast(
  message: string,
  variant: ToastItem['variant'] = 'info',
  title?: string,
  duration = 5000,
) {
  const id = crypto.randomUUID();
  toasts.update((items) => [...items, { id, message, variant, title }]);
  window.setTimeout(() => dismissToast(id), duration);
}
