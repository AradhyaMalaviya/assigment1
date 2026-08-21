<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { activities, type Activity } from '$lib/stores/activity';

  function formatTime(isoString: string): string {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  function getActivityIcon(type: Activity['type']): string {
    switch (type) {
      case 'started':
        return '🚀';
      case 'completed':
        return '✅';
      case 'scheduled':
        return '📅';
      default:
        return 'ℹ️';
    }
  }

  function getActivityVariant(type: Activity['type']): 'info' | 'success' | 'warning' | 'danger' {
    switch (type) {
      case 'started':
        return 'info';
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'warning';
      default:
        return 'info';
    }
  }
</script>

<Card>
  <div class="activity-timeline">
    <div class="header">
      <div class="title-group">
        <h2 class="title">Recent Activity</h2>
        <Badge variant="info" text={`${$activities.length}`} />
      </div>

      {#if $activities.length > 0}
        <Button variant="secondary" onClick={() => activities.clear()}>
          Clear Log
        </Button>
      {/if}
    </div>

    {#if $activities.length === 0}
      <div class="empty-wrap">
        <EmptyState
          title="No Recent Activity"
          message="Campaign dispatch events, batch updates, and schedules will appear here in real-time."
        />
      </div>
    {:else}
      <div class="timeline-list">
        {#each $activities as item (item.id)}
          <div class="timeline-item">
            <div class="item-icon-wrap">
              <span class="item-icon">{getActivityIcon(item.type)}</span>
              <div class="item-line"></div>
            </div>

            <div class="item-content">
              <div class="item-header">
                <span class="item-message">{item.message}</span>
                <span class="item-time">{formatTime(item.timestamp)}</span>
              </div>
              <div class="item-badge-wrap">
                <Badge variant={getActivityVariant(item.type)} text={item.type} />
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Card>

<style>
  .activity-timeline {
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

  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-height: 420px;
    overflow-y: auto;
    padding-right: var(--space-1);
  }

  .timeline-item {
    display: flex;
    gap: var(--space-3);
    position: relative;
  }

  .item-icon-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .item-icon {
    font-size: 1rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-secondary, #f1f5f9);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    z-index: 1;
  }

  .item-line {
    flex: 1;
    width: 2px;
    background-color: var(--color-border);
    margin-top: 0.25rem;
    margin-bottom: -0.5rem;
  }

  .timeline-item:last-child .item-line {
    display: none;
  }

  .item-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    padding-bottom: var(--space-2);
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .item-message {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    line-height: 1.4;
  }

  .item-time {
    font-size: 0.75rem;
    color: var(--color-muted);
    white-space: nowrap;
  }

  .item-badge-wrap {
    display: flex;
  }
</style>
