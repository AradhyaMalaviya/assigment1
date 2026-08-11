<script context="module" lang="ts">
  export type ToastItem = {
    id: string;
    message: string;
    title?: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
</script>

<script lang="ts">
  import { X } from 'lucide-svelte';
  import Alert from './Alert.svelte';

  export let toast: ToastItem;
  export let onDismiss: ((id: string) => void) | undefined = undefined;
</script>

<div class="toast" role="status">
  <Alert variant={toast.variant} title={toast.title}>{toast.message}</Alert>
  <button
    type="button"
    on:click={() => onDismiss?.(toast.id)}
    aria-label="Dismiss notification"
    title="Dismiss notification"><X size={16} /></button
  >
</div>

<style>
  .toast {
    position: relative;
    min-width: min(100%, 19rem);
    max-width: 24rem;
    box-shadow: var(--shadow-md);
  }
  .toast :global(.alert) {
    padding-right: 2.75rem;
  }
  button {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: grid;
    place-items: center;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: currentColor;
    cursor: pointer;
  }
</style>
