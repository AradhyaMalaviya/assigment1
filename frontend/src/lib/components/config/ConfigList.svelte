<script lang="ts">
  import ConfigCard from './ConfigCard.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { SmtpConfig } from '$lib/types/api';

  export let configs: SmtpConfig[];
  export let hasEnvConfig: boolean;
  export let onCreate: () => void;
  export let onView: (config: SmtpConfig) => void;
  export let onEdit: (config: SmtpConfig) => void;
  export let onSetDefault: (config: SmtpConfig) => void;
  export let onDelete: (config: SmtpConfig) => void;
</script>

{#if configs.length === 0}
  <EmptyState
    title="No SMTP configurations yet"
    message={hasEnvConfig
      ? "Sends currently fall back to the server's environment SMTP settings. Add a configuration to use your own account."
      : 'Add a configuration to start sending campaigns.'}
  >
    <svelte:fragment slot="action"><Button onClick={onCreate}>Add configuration</Button></svelte:fragment>
  </EmptyState>
{:else}
  <div class="grid">
    {#each configs as config (config.id)}
      <ConfigCard {config}
        onView={() => onView(config)} onEdit={() => onEdit(config)}
        onSetDefault={() => onSetDefault(config)} onDelete={() => onDelete(config)} />
    {/each}
  </div>
{/if}

<style>
  .grid {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  }
</style>
