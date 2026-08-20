<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte';
  import type { EmailLog } from '$lib/types/api';
  import { formatReportTimestamp } from '$lib/utils/reportFilters';

  export let log: EmailLog;

  function getStatusVariant(status: EmailLog['status']): 'success' | 'danger' | 'warning' {
    if (status === 'Sent') return 'success';
    if (status === 'Failed') return 'danger';
    return 'warning';
  }
</script>

<div class="mobile-log-card">
  <!-- Card Header: Email & Status Badge -->
  <div class="card-header">
    <div class="email-wrap">
      <span class="email-text" title={log.email}>{log.email}</span>
    </div>
    <Badge variant={getStatusVariant(log.status)} text={log.status} />
  </div>

  <!-- Card Body: Grid of fields -->
  <dl class="card-details-grid">
    <!-- Subject -->
    <div class="detail-item full-width">
      <dt class="detail-label">Subject</dt>
      <dd class="detail-value font-medium text-foreground">{log.subject || '—'}</dd>
    </div>

    <!-- Name & Company -->
    <div class="detail-item">
      <dt class="detail-label">First Name</dt>
      <dd class="detail-value">{log.firstName || '—'}</dd>
    </div>

    <div class="detail-item">
      <dt class="detail-label">Company</dt>
      <dd class="detail-value">{log.company || '—'}</dd>
    </div>

    <!-- Timestamp -->
    <div class="detail-item full-width">
      <dt class="detail-label">Timestamp</dt>
      <dd class="detail-value text-muted">{formatReportTimestamp(log.timestamp)}</dd>
    </div>

    <!-- Message ID -->
    {#if log.messageId}
      <div class="detail-item full-width">
        <dt class="detail-label">Message ID</dt>
        <dd class="detail-value font-mono text-xs text-muted break-all">{log.messageId}</dd>
      </div>
    {/if}

    <!-- Error / Message -->
    {#if log.message}
      <div class="detail-item full-width">
        <dt class="detail-label">Error / Details</dt>
        <dd
          class="detail-value text-xs {log.status !== 'Sent' ? 'text-danger font-medium' : 'text-muted'} break-words"
        >
          {log.message}
        </dd>
      </div>
    {/if}
  </dl>
</div>

<style>
  .mobile-log-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }

  .email-wrap {
    min-width: 0;
    flex: 1;
  }
  .email-text {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-foreground);
    word-break: break-all;
  }

  .card-details-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
    margin: 0;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .full-width {
    grid-column: span 2;
  }

  .detail-label {
    font-size: 0.6875rem;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted);
  }

  .detail-value {
    font-size: 0.8125rem;
    color: var(--color-foreground);
    margin: 0;
  }

  .text-foreground {
    color: var(--color-foreground);
  }
  .text-muted {
    color: var(--color-muted);
  }
  .text-danger {
    color: var(--color-danger);
  }
  .font-medium {
    font-weight: 500;
  }
  .break-all {
    word-break: break-all;
  }
  .break-words {
    word-break: break-word;
  }
</style>
