<script lang="ts">
  import { Send, CheckCircle2, CircleX, CircleAlert } from 'lucide-svelte';
  import type { ReportStats } from '$lib/types/api';

  export let stats: ReportStats | null = null;
  export let loading = false;
</script>

<div class="stats-grid">
  <!-- Total Emails -->
  <div class="stat-card stat-total">
    <div class="stat-header">
      <span class="stat-label">Total Emails</span>
      <div class="stat-icon-wrap total-icon">
        <Send size={18} />
      </div>
    </div>
    <div class="stat-value">
      {#if loading}
        <div class="skeleton-val"></div>
      {:else}
        <span>{stats?.total ?? 0}</span>
      {/if}
    </div>
    <p class="stat-sub">Authoritative total logged</p>
  </div>

  <!-- Sent Successfully -->
  <div class="stat-card stat-sent">
    <div class="stat-header">
      <span class="stat-label">Sent Successfully</span>
      <div class="stat-icon-wrap sent-icon">
        <CheckCircle2 size={18} />
      </div>
    </div>
    <div class="stat-value text-success">
      {#if loading}
        <div class="skeleton-val"></div>
      {:else}
        <span>{stats?.sent ?? 0}</span>
      {/if}
    </div>
    <p class="stat-sub">Delivered via SMTP</p>
  </div>

  <!-- Failed -->
  <div class="stat-card stat-failed">
    <div class="stat-header">
      <span class="stat-label">Failed</span>
      <div class="stat-icon-wrap failed-icon">
        <CircleX size={18} />
      </div>
    </div>
    <div class="stat-value text-danger">
      {#if loading}
        <div class="skeleton-val"></div>
      {:else}
        <span>{stats?.failed ?? 0}</span>
      {/if}
    </div>
    <p class="stat-sub">Rejected by mail server</p>
  </div>

  <!-- Errors -->
  <div class="stat-card stat-errors">
    <div class="stat-header">
      <span class="stat-label">Errors</span>
      <div class="stat-icon-wrap errors-icon">
        <CircleAlert size={18} />
      </div>
    </div>
    <div class="stat-value text-warning">
      {#if loading}
        <div class="skeleton-val"></div>
      {:else}
        <span>{stats?.errors ?? 0}</span>
      {/if}
    </div>
    <p class="stat-sub">Transport or runtime errors</p>
  </div>
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }
  @media (min-width: 40rem) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 64rem) {
    .stats-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .stat-label {
    font-size: 0.8125rem;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
  }

  .stat-icon-wrap {
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .total-icon {
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
  }
  .sent-icon {
    background: color-mix(in srgb, var(--color-success) 12%, transparent);
    color: var(--color-success);
  }
  .failed-icon {
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    color: var(--color-danger);
  }
  .errors-icon {
    background: color-mix(in srgb, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
  }

  .stat-value {
    font-size: 1.875rem;
    font-weight: 700;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    color: var(--color-foreground);
  }
  .text-success {
    color: var(--color-success);
  }
  .text-danger {
    color: var(--color-danger);
  }
  .text-warning {
    color: var(--color-warning);
  }

  .stat-sub {
    font-size: 0.75rem;
    color: var(--color-muted);
    margin: 0;
  }

  .skeleton-val {
    width: 3.5rem;
    height: 2rem;
    background: var(--color-border);
    border-radius: var(--radius-sm);
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>
