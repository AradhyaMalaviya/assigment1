<script lang="ts">
  import { CheckCircle2, CircleAlert, CircleX, Info } from 'lucide-svelte';
  export let variant: 'success' | 'warning' | 'danger' | 'info' = 'info';
  export let title: string | undefined = undefined;
</script>

<div class="alert {variant}" role={variant === 'danger' ? 'alert' : 'status'}>
  {#if variant === 'success'}<CheckCircle2 size={20} />{:else if variant === 'warning'}<CircleAlert
      size={20}
    />{:else if variant === 'danger'}<CircleX size={20} />{:else}<Info size={20} />{/if}
  <div>
    {#if title}<strong>{title}</strong>{/if}<slot />
  </div>
</div>

<style>
  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    border: 1px solid;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    line-height: 1.45;
  }
  .alert strong {
    display: block;
    margin-bottom: var(--space-1);
  }
  .success {
    color: color-mix(in srgb, var(--color-success) 78%, black);
    background: color-mix(in srgb, var(--color-success) 12%, white);
    border-color: color-mix(in srgb, var(--color-success) 38%, white);
  }
  .warning {
    color: color-mix(in srgb, var(--color-warning) 58%, black);
    background: color-mix(in srgb, var(--color-warning) 16%, white);
    border-color: color-mix(in srgb, var(--color-warning) 42%, white);
  }
  .danger {
    color: color-mix(in srgb, var(--color-danger) 78%, black);
    background: color-mix(in srgb, var(--color-danger) 10%, white);
    border-color: color-mix(in srgb, var(--color-danger) 34%, white);
  }
  .info {
    color: color-mix(in srgb, var(--color-info) 78%, black);
    background: color-mix(in srgb, var(--color-info) 10%, white);
    border-color: color-mix(in srgb, var(--color-info) 34%, white);
  }
</style>
