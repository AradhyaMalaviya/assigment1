<script lang="ts">
  import { Eye, Pencil, Star, Trash2 } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { SmtpConfig } from '$lib/types/api';

  export let config: SmtpConfig;
  export let onView: () => void;
  export let onEdit: () => void;
  export let onSetDefault: () => void;
  export let onDelete: () => void;
</script>

<Card padding="none">
  <svelte:fragment slot="header">
    <div class="card-header">
      <span class="config-name">{config.name || 'Unnamed configuration'}</span>
      {#if config.isDefault}<Badge variant="success" text="Default" />{/if}
    </div>
  </svelte:fragment>

  <div class="card-body">
    <dl>
      <div><dt>Host</dt><dd>{config.host}:{config.port}</dd></div>
      <div><dt>From</dt><dd>{config.fromEmail}</dd></div>
      <div><dt>Security</dt><dd><Badge variant={config.secure ? 'success' : 'warning'} text={config.secure ? 'TLS/SSL' : 'No encryption'} /></dd></div>
    </dl>
  </div>

  <svelte:fragment slot="footer">
    <div class="card-actions">
      <Button variant="ghost" onClick={onView} ariaLabel="View details"><Eye size={16} /> View</Button>
      <Button variant="ghost" onClick={onEdit} ariaLabel="Edit configuration"><Pencil size={16} /> Edit</Button>
      {#if !config.isDefault}
        <Button variant="ghost" onClick={onSetDefault} ariaLabel="Set as default"><Star size={16} /> Default</Button>
      {/if}
      <Button variant="ghost" onClick={onDelete} ariaLabel="Delete configuration"><Trash2 size={16} /> Delete</Button>
    </div>
  </svelte:fragment>
</Card>

<style>
  .card-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .config-name {
    font-weight: 650;
    font-size: 0.9375rem;
  }
  .card-body {
    padding: var(--space-4) var(--space-5);
  }
  dl {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }
  dl div {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  dt {
    min-width: 4.5rem;
    color: var(--color-muted);
    font-size: 0.8125rem;
    font-weight: 600;
  }
  dd {
    margin: 0;
    font-size: 0.875rem;
  }
  .card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }
</style>
