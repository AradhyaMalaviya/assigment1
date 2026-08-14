<script lang="ts">
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { ScheduledJob } from '$lib/types/api';

  export let jobs: ScheduledJob[] = [];

  function formatLocalDateTime(isoString: string): string {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  }
</script>

<Card>
  <div class="scheduled-preview">
    <div class="header">
      <div class="title-group">
        <h2 class="title">Upcoming Scheduled Campaigns</h2>
        <Badge variant="info" text={`${jobs.length} Queued`} />
      </div>
      <Button variant="secondary" onClick={() => goto('/scheduled')}>
        View All Jobs ↗
      </Button>
    </div>

    {#if jobs.length === 0}
      <div class="empty-wrap">
        <EmptyState
          title="No Scheduled Campaigns"
          message="You do not have any campaigns queued for future automated delivery."
        />
      </div>
    {:else}
      <div class="jobs-list">
        {#each jobs as job (job.id)}
          <div class="job-item">
            <div class="job-main">
              <div class="job-title-row">
                <span class="job-subject">
                  {job.emailJob?.subject || 'Bulk Email Campaign'}
                </span>
                <Badge
                  variant={job.status === 'running' ? 'info' : 'warning'}
                  text={job.status === 'running' ? '● Running' : '🕒 Scheduled'}
                />
              </div>

              <div class="job-meta-row">
                <span class="meta-item">
                  <strong>Launch:</strong> {formatLocalDateTime(job.scheduledTime)}
                </span>
                <span class="meta-divider">•</span>
                <span class="meta-item">
                  <strong>Contacts:</strong> {job.emailJob?.contacts?.length ?? '—'}
                </span>
                <span class="meta-divider">•</span>
                <span class="meta-item">
                  {#if job.batchConfig?.enabled}
                    <span class="batch-tag">⚡ Batch ({job.batchConfig.batchSize} / batch)</span>
                  {:else}
                    <span class="sequential-tag">Sequential</span>
                  {/if}
                </span>
                {#if job.notifyEmail}
                  <span class="meta-divider">•</span>
                  <span class="meta-item notify-tag" title="Notification alert will be sent on completion">
                    🔔 {job.notifyEmail}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Card>

<style>
  .scheduled-preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .empty-wrap {
    padding: var(--space-4) 0;
  }

  .jobs-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .job-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3);
    background-color: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    transition: background-color 150ms ease;
  }

  .job-item:hover {
    background-color: color-mix(in srgb, var(--color-primary) 4%, var(--color-bg-secondary, #f8fafc));
  }

  .job-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
  }

  .job-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .job-subject {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .job-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.8125rem;
    color: var(--color-muted);
  }

  .meta-divider {
    color: var(--color-border);
  }

  .batch-tag {
    color: #4f46e5;
    font-weight: 500;
  }

  .sequential-tag {
    color: #059669;
    font-weight: 500;
  }

  .notify-tag {
    color: #d97706;
  }
</style>
