<script lang="ts">
  import Spinner from './Spinner.svelte';

  export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  export let loading = false;
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let ariaLabel: string | undefined = undefined;
  export let onClick: ((event: MouseEvent) => void) | undefined = undefined;
</script>

<button
  {type}
  class="button {variant}"
  disabled={disabled || loading}
  aria-busy={loading}
  aria-label={ariaLabel}
  on:click={onClick}
>
  {#if loading}<Spinner size="sm" />{/if}
  <slot />
</button>

<style>
  .button {
    display: inline-flex;
    min-height: 2.5rem;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    padding: 0.5rem var(--space-4);
    font-weight: 650;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      color 160ms ease;
  }
  .button:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }
  .primary {
    color: white;
    background: var(--color-primary);
  }
  .primary:hover:not(:disabled) {
    background: var(--color-primary-strong);
  }
  .secondary {
    color: var(--color-foreground);
    background: var(--color-surface);
    border-color: var(--color-border);
  }
  .secondary:hover:not(:disabled) {
    background: var(--color-background);
  }
  .danger {
    color: white;
    background: var(--color-danger);
  }
  .danger:hover:not(:disabled) {
    filter: brightness(0.9);
  }
  .ghost {
    color: var(--color-foreground);
    background: transparent;
  }
  .ghost:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
</style>
