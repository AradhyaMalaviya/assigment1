<script lang="ts">
  import { CheckCircle2, CircleAlert, CircleX, Info } from 'lucide-svelte';
  export let variant: 'success' | 'danger' | 'warning' | 'info' = 'info';
  export let text = '';
</script>

<span class="badge {variant}">
  {#if variant === 'success'}<CheckCircle2 size={15} />{:else if variant === 'danger'}<CircleX
      size={15}
    />{:else if variant === 'warning'}<CircleAlert size={15} />{:else}<Info size={15} />{/if}
  <span>{text}</span>
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    border-radius: 999px;
    padding: 0.25rem var(--space-2);
    font-size: 0.8125rem;
    font-weight: 650;
  }
  .success {
    color: color-mix(in srgb, var(--color-success) 80%, black);
    background: color-mix(in srgb, var(--color-success) 14%, white);
  }
  .danger {
    color: color-mix(in srgb, var(--color-danger) 80%, black);
    background: color-mix(in srgb, var(--color-danger) 12%, white);
  }
  .warning {
    color: color-mix(in srgb, var(--color-warning) 55%, black);
    background: color-mix(in srgb, var(--color-warning) 20%, white);
  }
  .info {
    color: color-mix(in srgb, var(--color-info) 80%, black);
    background: color-mix(in srgb, var(--color-info) 12%, white);
  }
</style>
