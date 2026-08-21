<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import { StatsCard, BatchMonitor, ScheduledJobsPreview, ActivityTimeline } from '$lib/components/dashboard';
  import { getDashboardData, getBatchStatus } from '$lib/api/dashboard';
  import {
    isPolling,
    pollInterval,
    lastPolled,
    pollStatus,
    serviceDegraded,
    isFetching,
    startAdaptivePolling,
    stopAdaptivePolling,
    triggerStateCheck
  } from '$lib/stores/polling';
  import type { BatchJob, ScheduledJob } from '$lib/types/api';

  let initialLoading: boolean = true;
  let activeBatchJob: BatchJob | null = null;
  let scheduledJobs: ScheduledJob[] = [];
  let fetchError: string | null = null;

  async function fetchDashboardDetails() {
    try {
      fetchError = null;
      const dataRes = await getDashboardData();
      if (dataRes.data) {
        scheduledJobs = dataRes.data.scheduledJobs || [];

        // Check if there is an active batch from dashboard data or query batch-status directly
        if (dataRes.data.batch?.currentJob) {
          activeBatchJob = dataRes.data.batch.currentJob;
        } else if ($pollStatus?.hasActiveBatch) {
          const batchRes = await getBatchStatus();
          activeBatchJob = batchRes.data?.currentJob || null;
        } else {
          activeBatchJob = null;
        }
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
    } finally {
      initialLoading = false;
    }
  }

  onMount(() => {
    if (browser) {
      startAdaptivePolling(fetchDashboardDetails);
    }
  });

  onDestroy(() => {
    if (browser) {
      stopAdaptivePolling();
    }
  });

  function handleManualRefresh() {
    triggerStateCheck();
  }

  function formatTime(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>Dashboard | Bulk Email Sender</title>
</svelte:head>

<div class="dashboard-page">
  <PageHeader
    title="Operations Dashboard"
    description="Real-time monitoring for active batch email jobs, upcoming scheduled campaigns, and recent operational activity."
  >
    <div class="header-actions">
      <Button
        variant="secondary"
        loading={$isFetching}
        disabled={$isFetching}
        onClick={handleManualRefresh}
      >
        🔄 Refresh Status
      </Button>
      <Button variant="primary" onClick={() => goto('/send')}>
        🚀 New Campaign
      </Button>
    </div>
  </PageHeader>

  <!-- Live Polling Status Indicator Bar -->
  <div class="status-bar">
    <div class="status-indicator">
      {#if $isPolling}
        <span class="status-badge-dot live"></span>
        <span class="status-text">
          <strong>Live Polling Active</strong>
          <span class="status-cadence">({$pollInterval ? `${$pollInterval / 1000}s interval` : 'active'})</span>
        </span>
      {:else if $serviceDegraded}
        <span class="status-badge-dot degraded"></span>
        <span class="status-text warning">
          <strong>Service Degraded:</strong> {$serviceDegraded}
        </span>
      {:else}
        <span class="status-badge-dot idle"></span>
        <span class="status-text idle-text">
          <strong>System Idle</strong> (0 network polling requests while inactive)
        </span>
      {/if}
    </div>

    <div class="status-meta">
      {#if $lastPolled}
        <span class="last-polled">
          Last checked: {formatTime($lastPolled)}
        </span>
      {/if}
    </div>
  </div>

  {#if fetchError}
    <Alert variant="danger" title="Dashboard Data Notice">
      {fetchError}
    </Alert>
  {/if}

  {#if initialLoading}
    <div class="loading-state">
      <Spinner size="lg" />
      <p class="loading-text">Connecting to adaptive monitoring service...</p>
    </div>
  {:else}
    <!-- Active Batch Monitor Banner -->
    {#if activeBatchJob}
      <section class="active-batch-section" aria-label="Active Batch Campaign">
        <BatchMonitor job={activeBatchJob} on:actionComplete={fetchDashboardDetails} />
      </section>
    {/if}

    <!-- Quick Overview Stats -->
    <div class="stats-row">
      <StatsCard
        title="Active Batch Jobs"
        value={activeBatchJob ? '1 Running' : 'None'}
        icon="zap"
        variant={activeBatchJob ? 'primary' : 'default'}
        badgeText={activeBatchJob ? 'Active' : 'Idle'}
        badgeVariant={activeBatchJob ? 'info' : 'info'}
        subtitle={activeBatchJob ? `Job #${activeBatchJob.id.slice(0, 8)}` : 'No batches in progress'}
      />

      <StatsCard
        title="Scheduled Queue"
        value={`${scheduledJobs.length} Campaigns`}
        icon="clock"
        variant={scheduledJobs.length > 0 ? 'warning' : 'default'}
        badgeText={scheduledJobs.length > 0 ? 'Queued' : 'Empty'}
        badgeVariant={scheduledJobs.length > 0 ? 'warning' : 'info'}
        subtitle={scheduledJobs.length > 0 ? 'Upcoming scheduled sends' : 'No pending schedules'}
      />

      <StatsCard
        title="Monitoring Mode"
        value={$isPolling ? 'Adaptive Active' : 'Zero-Waste Idle'}
        icon="activity"
        variant={$isPolling ? 'success' : 'default'}
        badgeText={$isPolling ? 'Polling' : 'Resting'}
        badgeVariant={$isPolling ? 'success' : 'info'}
        subtitle={$isPolling ? `Polling cadence: ${$pollInterval ? `${$pollInterval / 1000}s` : 'active'}` : 'Zero requests while inactive'}
      />
    </div>

    <!-- Main Content 2-Column Grid -->
    <div class="dashboard-grid">
      <!-- Left Column: Scheduled Preview & Quick Actions -->
      <div class="grid-col left-col">
        <section aria-label="Scheduled Campaigns">
          <ScheduledJobsPreview jobs={scheduledJobs} />
        </section>

        <!-- Quick Launch Shortcuts -->
        <Card>
          <div class="shortcuts-card">
            <h3 class="shortcuts-title">Quick Actions</h3>
            <div class="shortcuts-grid">
              <a href="/send" class="shortcut-btn primary">
                <span class="shortcut-icon">✉️</span>
                <div class="shortcut-text">
                  <strong>Compose Campaign</strong>
                  <span>Upload contacts and dispatch emails</span>
                </div>
              </a>

              <a href="/configs" class="shortcut-btn">
                <span class="shortcut-icon">⚙️</span>
                <div class="shortcut-text">
                  <strong>SMTP Configurations</strong>
                  <span>Manage senders and test connections</span>
                </div>
              </a>

              <a href="/reports" class="shortcut-btn">
                <span class="shortcut-icon">📊</span>
                <div class="shortcut-text">
                  <strong>Delivery Reports</strong>
                  <span>Review email transmission logs</span>
                </div>
              </a>

              <a href="/scheduled" class="shortcut-btn">
                <span class="shortcut-icon">📅</span>
                <div class="shortcut-text">
                  <strong>Scheduled Queue</strong>
                  <span>Manage upcoming automated jobs</span>
                </div>
              </a>
            </div>
          </div>
        </Card>
      </div>

      <!-- Right Column: Activity Timeline -->
      <div class="grid-col right-col">
        <section aria-label="Recent Operational Activity">
          <ActivityTimeline />
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .status-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    background-color: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: 0.8125rem;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .status-badge-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--color-muted);
  }

  .status-badge-dot.live {
    background-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }

  .status-badge-dot.degraded {
    background-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  }

  .status-badge-dot.idle {
    background-color: #94a3b8;
  }

  .status-text {
    color: var(--color-text);
  }

  .status-cadence {
    color: var(--color-muted);
  }

  .status-text.warning {
    color: #b45309;
  }

  .status-text.idle-text {
    color: var(--color-muted);
  }

  .status-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--color-muted);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-8) var(--space-4);
  }

  .loading-text {
    color: var(--color-muted);
    font-size: 0.9375rem;
    margin: 0;
  }

  .active-batch-section {
    width: 100%;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-3);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  @media (min-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: 3fr 2fr;
    }
  }

  .grid-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .shortcuts-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .shortcuts-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-2);
  }

  .shortcut-btn {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background-color: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    text-decoration: none;
    color: var(--color-text);
    transition: all 150ms ease;
  }

  .shortcut-btn:hover {
    background-color: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg-secondary, #f8fafc));
    border-color: var(--color-primary);
  }

  .shortcut-btn.primary {
    background-color: color-mix(in srgb, var(--color-primary) 8%, white);
    border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  }

  .shortcut-btn.primary:hover {
    background-color: color-mix(in srgb, var(--color-primary) 14%, white);
  }

  .shortcut-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .shortcut-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .shortcut-text strong {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .shortcut-text span {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
</style>
