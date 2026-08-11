<script lang="ts">
  import Toast, { type ToastItem } from './Toast.svelte';
  export let toasts: ToastItem[] = [];
  export let onDismiss: ((id: string) => void) | undefined = undefined;
</script>

<section class="host" aria-live="polite" aria-atomic="false" aria-label="Notifications">
  {#each toasts as toast (toast.id)}<Toast {toast} {onDismiss} />{/each}
</section>

<style>
  .host {
    position: fixed;
    z-index: 60;
    top: var(--space-4);
    right: var(--space-4);
    display: grid;
    gap: var(--space-3);
    width: min(calc(100vw - 2rem), 24rem);
  }
</style>
