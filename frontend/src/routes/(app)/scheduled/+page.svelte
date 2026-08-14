<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import { StatsCard } from '$lib/components/dashboard';
  import { ScheduledJobTable, ScheduledJobCard } from '$lib/components/scheduled';
  import { getScheduledJobs, cancelScheduledJob } from '$lib/api/scheduled';
  import { addToast } from '$lib/stores/toast';
  import type { ScheduledJob } from '$lib/types/api';

  let jobs: ScheduledJob[] = [];
  let loading: boolean = true;
  let refreshing: boolean = false;
  let fetchError: string | null = null;

  // Search & Filter
  let searchQuery: string = '';
  let statusFilter: 'all' | 'scheduled' | 'running' = 'all';

  // Cancellation State
  let jobToCancel: ScheduledJob | null = null;
  let isCancelModalOpen: boolean = false;
  let isCancelling: boolean = false;

  async function loadJobs(isBackground: boolean = false) {
    if (!isBackground) loading = true;
    else refreshing = true;
    fetchError = null;

    try {
      const res = await getScheduledJobs();
      if (res.data) {
        jobs = res.data;
      } else {
        jobs = [];
      }
    } catch (err) {
      console.warn('Failed to load scheduled jobs:', err);
      fetchError = err instanceof Error ? err.message : 'Failed to retrieve scheduled jobs';
      jobs = [];
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  onMount(() => {
    if (browser) {
      loadJobs();
    }
  });

  function handleOpenCancelModal(job: ScheduledJob) {
    if (job.status === 'running') {
      addToast('Cannot cancel a campaign that is currently running', 'warning');
      return;
    }
    jobToCancel = job;
    isCancelModalOpen = true;
  }

  async function handleConfirmCancel() {
    if (!jobToCancel) return;

    isCancelling = true;
    const targetJob = jobToCancel;
    const subject = targetJob.subject || targetJob.emailJob?.subject || 'Scheduled Campaign';

    try {
      const res = await cancelScheduledJob(targetJob.id);
      if (res.success) {
        addToast(`Campaign "${subject}" was cancelled successfully`, 'success');
        isCancelModalOpen = false;
        jobToCancel = null;
        await loadJobs(true);
      } else {
        addToast(res.message || 'Failed to cancel campaign', 'danger');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cancelling scheduled campaign';
      addToast(msg, 'danger');
    } finally {
      isCancelling = false;
    }
  }

  function handleCloseCancelModal() {
    if (isCancelling) return;
    isCancelModalOpen = false;
    jobToCancel = null;
  }

  $: totalScheduled = jobs.filter((j) => j.status === 'scheduled').length;
  $: totalRunning = jobs.filter((j) => j.status === 'running').length;
  $: totalQueuedContacts = jobs.reduce((sum, j) => {
    const count = j.contactCount ?? j.contact_count ?? j.emailJob?.contacts?.length ?? 0;
    return sum + count;
  }, 0);

  $: filteredJobs = jobs.filter((job) => {
    // Status filter
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const subject = (job.subject || job.emailJob?.subject || '').toLowerCase();
      const config = (job.configName || job.config_name || '').toLowerCase();
      const notify = (job.notifyEmail || job.notify_email || '').toLowerCase();
      const id = job.id.toLowerCase();
      return subject.includes(q) || config.includes(q) || notify.includes(q) || id.includes(q);
    }

    return true;
  });
</script>

<svelte:head>
  <title>Scheduled Campaigns | Bulk Email Sender</title>
</svelte:head>

<div class="scheduled-page">
  <PageHeader
    title="Scheduled Campaigns"
    description="Manage and monitor email campaigns queued for automated future dispatch across all sending modes."
  >
    <div class="header-actions">
      <Button
        variant="secondary"
        loading={refreshing}
        disabled={loading || refreshing}
        onClick={() => loadJobs(true)}
      >
        🔄 Refresh
      </Button>
      <Button variant="primary" onClick={() => goto('/send')}>
        📅 Schedule Campaign
      </Button>
    </div>
  </PageHeader>

  <!-- Scheduler Notice -->
  <Alert variant="info" title="Scheduler Execution Notice">
    The backend background scheduler evaluates queued campaigns every <strong>60 seconds</strong>. Dispatch begins automatically within 60 seconds of your target scheduled time.
  </Alert>

  {#if fetchError}
    <Alert variant="danger" title="Error Loading Queue">
      {fetchError}
    </Alert>
  {/if}

  {#if loading}
    <div class="loading-state">
      <Spinner size="lg" />
      <p class="loading-text">Loading scheduled campaigns queue...</p>
    </div>
  {:else}
    <!-- Metrics Row -->
    <div class="stats-row">
      <StatsCard
        title="Pending Scheduled"
        value={totalScheduled}
        icon="clock"
        variant={totalScheduled > 0 ? 'warning' : 'default'}
        badgeText={totalScheduled > 0 ? 'Queued' : 'Empty'}
        badgeVariant={totalScheduled > 0 ? 'warning' : 'info'}
        subtitle="Awaiting trigger timestamp"
      />

      <StatsCard
        title="Active Dispatch"
        value={totalRunning}
        icon="activity"
        variant={totalRunning > 0 ? 'primary' : 'default'}
        badgeText={totalRunning > 0 ? 'Executing' : 'Idle'}
        badgeVariant={totalRunning > 0 ? 'info' : 'info'}
        subtitle="Currently sending batches"
      />

      <StatsCard
        title="Total Queued Recipients"
        value={totalQueuedContacts}
        icon="send"
        variant="default"
        badgeText={`${jobs.length} campaigns`}
        badgeVariant="info"
        subtitle="Across all scheduled jobs"
      />
    </div>

    <!-- Main Content Area -->
    <div class="content-panel">
      <!-- Search and Filter Bar -->
      <div class="filters-bar">
        <div class="search-wrap">
          <Input
            id="jobSearch"
            name="jobSearch"
            type="search"
            placeholder="Search by subject, config name, notification email, or ID..."
            bind:value={searchQuery}
          />
        </div>

        <div class="status-tabs" role="tablist" aria-label="Filter jobs by status">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            class="tab-btn"
            class:active={statusFilter === 'all'}
            on:click={() => (statusFilter = 'all')}
          >
            All ({jobs.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'scheduled'}
            class="tab-btn"
            class:active={statusFilter === 'scheduled'}
            on:click={() => (statusFilter = 'scheduled')}
          >
            🕒 Scheduled ({totalScheduled})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'running'}
            class="tab-btn"
            class:active={statusFilter === 'running'}
            on:click={() => (statusFilter = 'running')}
          >
            ● Running ({totalRunning})
          </button>
        </div>
      </div>

      {#if jobs.length === 0}
        <div class="empty-container">
          <EmptyState
            title="No Scheduled Campaigns Found"
            message="You currently do not have any email campaigns scheduled for future automated delivery."
          >
            <div slot="action">
              <Button variant="primary" onClick={() => goto('/send')}>
                📅 Schedule Your First Campaign
              </Button>
            </div>
          </EmptyState>
        </div>
      {:else if filteredJobs.length === 0}
        <div class="empty-container">
          <EmptyState
            title="No Matching Campaigns"
            message="No scheduled campaigns match your current search and filter criteria."
          >
            <div slot="action">
              <Button variant="secondary" onClick={() => { searchQuery = ''; statusFilter = 'all'; }}>
                Clear Filters
              </Button>
            </div>
          </EmptyState>
        </div>
      {:else}
        <!-- Desktop Table View (>= 768px) -->
        <div class="hidden md:block">
          <ScheduledJobTable
            jobs={filteredJobs}
            cancellingId={isCancelling ? jobToCancel?.id || null : null}
            onCancel={handleOpenCancelModal}
          />
        </div>

        <!-- Mobile Card List View (< 768px) -->
        <div class="block md:hidden space-y-3">
          {#each filteredJobs as job (job.id)}
            <ScheduledJobCard
              {job}
              cancelling={isCancelling && jobToCancel?.id === job.id}
              onCancel={handleOpenCancelModal}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Cancellation Confirmation Dialog -->
{#if jobToCancel}
  <ConfirmDialog
    open={isCancelModalOpen}
    title="Cancel Scheduled Campaign?"
    message={`Are you sure you want to cancel the scheduled campaign "${jobToCancel.subject || jobToCancel.emailJob?.subject || 'Untitled'}"? It will be permanently removed from the scheduler queue and will not be dispatched.`}
    confirmLabel="Yes, Cancel Campaign"
    loading={isCancelling}
    onConfirm={handleConfirmCancel}
    onCancel={handleCloseCancelModal}
  />
{/if}

<style>
  .scheduled-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-3);
  }

  .content-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .filters-bar {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  @media (min-width: 768px) {
    .filters-bar {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .search-wrap {
    flex: 1;
    max-width: 460px;
  }

  .status-tabs {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background-color: var(--color-bg-secondary, #f1f5f9);
    padding: 0.25rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .tab-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
    transition: all 150ms ease;
  }

  .tab-btn:hover {
    color: var(--color-text);
  }

  .tab-btn.active {
    background-color: white;
    color: var(--color-text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  :global(.dark) .tab-btn.active {
    background-color: #1e293b;
    color: white;
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

  .empty-container {
    padding: var(--space-8) var(--space-4);
    background-color: white;
    border: 1px solid var(--color-border);
    border-radius: 12px;
  }

  :global(.dark) .empty-container {
    background-color: #1e293b;
    border-color: #334155;
  }
</style>
