<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SmtpConfig } from '$lib/types/api';
  import Alert from '$lib/components/ui/Alert.svelte';

  const dispatch = createEventDispatcher<{
    select: { configId: string; config: SmtpConfig | null };
  }>();

  export let configs: SmtpConfig[] = [];
  export let selectedConfigId: string = '';
  export let disabled: boolean = false;

  $: selectedConfig = configs.find((c) => c.id === selectedConfigId) || null;

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const configId = target.value;
    const config = configs.find((c) => c.id === configId) || null;
    dispatch('select', { configId, config });
  }
</script>

<div class="config-selector">
  <label for="smtp-config-select" class="selector-label">
    SMTP Configuration <span class="required-mark">*</span>
  </label>

  {#if configs.length === 0}
    <Alert variant="warning" title="No SMTP Configuration Available">
      You need at least one configured SMTP account to compose and send campaigns.
      <a href="/configs" class="config-link">Go to SMTP Configurations to create one</a>.
    </Alert>
  {:else}
    <select
      id="smtp-config-select"
      value={selectedConfigId}
      on:change={handleChange}
      {disabled}
      class="config-dropdown"
      required
    >
      <option value="" disabled>-- Select an SMTP Configuration --</option>
      {#each configs as cfg (cfg.id || cfg.name)}
        <option value={cfg.id}>
          {cfg.name || cfg.host} ({cfg.fromEmail}) {cfg.isDefault ? '★ [Default]' : ''}
        </option>
      {/each}
    </select>

    {#if selectedConfig}
      <div class="config-summary-card">
        <div class="summary-header">
          <span class="cfg-name">{selectedConfig.name}</span>
          {#if selectedConfig.isDefault}
            <span class="default-badge">Default</span>
          {/if}
        </div>
        <div class="summary-details">
          <span><strong>Host:</strong> {selectedConfig.host}:{selectedConfig.port} ({selectedConfig.secure ? 'SSL/TLS' : 'STARTTLS'})</span>
          <span><strong>From:</strong> {selectedConfig.fromName ? `${selectedConfig.fromName} <${selectedConfig.fromEmail}>` : selectedConfig.fromEmail}</span>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .config-selector {
    display: grid;
    gap: var(--space-2, 0.5rem);
  }
  .selector-label {
    font-weight: 650;
    font-size: 0.875rem;
    color: var(--color-foreground, #1e293b);
  }
  .required-mark {
    color: #ef4444;
  }
  .config-dropdown {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--color-border, #cbd5e1);
    border-radius: var(--radius-md, 0.375rem);
    background: var(--color-surface, #ffffff);
    color: var(--color-foreground, #1e293b);
    font-size: 0.9375rem;
  }
  .config-dropdown:focus {
    outline: 2px solid var(--color-primary, #4f46e5);
    outline-offset: 1px;
  }
  .config-link {
    font-weight: 600;
    text-decoration: underline;
    color: var(--color-primary, #4f46e5);
    margin-left: 0.25rem;
  }
  .config-summary-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.75rem;
    font-size: 0.875rem;
    display: grid;
    gap: 0.375rem;
  }
  .summary-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .cfg-name {
    font-weight: 600;
    color: #0f172a;
  }
  .default-badge {
    background: #dbeafe;
    color: #1e40af;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }
  .summary-details {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    color: #475569;
  }
</style>
