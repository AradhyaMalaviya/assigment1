<script lang="ts">
  import type { ProviderInfo } from '$lib/types/api';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';

  export let providerInfo: ProviderInfo | null = null;
  export let loadingProvider: boolean = false;
  export let providerError: string | null = null;
  export let recipientCount: number = 0;

  $: isOverLimit = providerInfo && recipientCount > providerInfo.maxContacts;
</script>

<div class="provider-limit-panel">
  <div class="panel-header">
    <span class="panel-title">🛡️ SMTP Provider Limits & Guidance</span>
  </div>

  {#if loadingProvider}
    <div class="status-state loading">
      <Spinner size="sm" />
      <span>Fetching provider rules and rate limits for selected host...</span>
    </div>
  {:else if providerError}
    <Alert variant="danger" title="Provider Limit Error">
      {providerError}
    </Alert>
  {:else if providerInfo}
    <div class="limits-card" class:over-limit={isOverLimit}>
      <div class="card-grid">
        <div class="limit-stat">
          <span class="stat-label">Detected Provider</span>
          <span class="stat-val provider-name">{providerInfo.provider}</span>
        </div>
        <div class="limit-stat">
          <span class="stat-label">Daily Limit</span>
          <span class="stat-val">{providerInfo.dailyLimit.toLocaleString()} emails/day</span>
        </div>
        <div class="limit-stat">
          <span class="stat-label">Max Campaign Contacts</span>
          <span class="stat-val max-cap">{providerInfo.maxContacts.toLocaleString()}</span>
        </div>
        <div class="limit-stat">
          <span class="stat-label">Recommended Batch Size</span>
          <span class="stat-val">{providerInfo.recommendedBatchSize} emails/batch</span>
        </div>
        <div class="limit-stat">
          <span class="stat-label">Recommended Delay</span>
          <span class="stat-val">{providerInfo.recommendedDelay}s per email</span>
        </div>
      </div>

      {#if isOverLimit}
        <div class="limit-warning">
          <Alert variant="danger" title="Selected Recipients Exceed Provider Limit">
            Your selected recipient count (<strong>{recipientCount}</strong>) exceeds the maximum single-campaign allowance for {providerInfo.provider} (<strong>{providerInfo.maxContacts}</strong>).
            Please reduce your recipient range in the Recipient Range Selector.
          </Alert>
        </div>
      {/if}
    </div>
  {:else}
    <p class="no-provider-text">Select an SMTP configuration above to view provider limits and delivery guidance.</p>
  {/if}
</div>

<style>
  .provider-limit-panel {
    display: grid;
    gap: 0.5rem;
  }
  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .panel-title {
    font-weight: 650;
    font-size: 0.875rem;
    color: var(--color-foreground, #1e293b);
  }
  .status-state.loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.84375rem;
    color: #475569;
    padding: 0.5rem 0.75rem;
    background: #f1f5f9;
    border-radius: var(--radius-md, 0.375rem);
  }
  .no-provider-text {
    font-size: 0.8125rem;
    color: var(--color-muted, #64748b);
    margin: 0;
  }
  .limits-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.75rem;
    display: grid;
    gap: 0.75rem;
  }
  .limits-card.over-limit {
    border-color: #fca5a5;
    background: #fff5f5;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
  }
  .limit-stat {
    display: flex;
    flex-direction: column;
  }
  .stat-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
  }
  .stat-val {
    font-size: 0.875rem;
    font-weight: 650;
    color: #0f172a;
  }
  .provider-name {
    color: var(--color-primary, #4f46e5);
  }
  .max-cap {
    color: #0369a1;
  }
  .limit-warning {
    margin-top: 0.25rem;
  }
</style>
