<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import { pauseBatch, resumeBatch, cancelBatch } from '$lib/api/dashboard';
  import { addToast } from '$lib/stores/toast';
  import { addActivity } from '$lib/stores/activity';
  import { triggerStateCheck } from '$lib/stores/polling';
  import type { BatchJob } from '$lib/types/api';

  export let job: BatchJob;

  const dispatch = createEventDispatcher<{
    actionComplete: void;
  }>();

  let actionLoading: 'pause' | 'resume' | 'cancel' | null = null;
  let showCancelConfirm: boolean = false;
  let errorMessage: string | null = null;

  // Next batch countdown display state
  let countdownText: string = '';
  let countdownSeconds: number = 0;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  $: sentCount = job.emailsSent || 0;
  $: failedCount = job.emailsFailed || 0;
  $: totalContacts = job.totalContacts || 1;
  $: processedCount = sentCount + failedCount;
  $: percent = Math.min(100, Math.max(0, Math.round((processedCount / totalContacts) * 100)));

  $: statusVariant = (
    job.status === 'Running'
      ? 'info'
      : job.status === 'Paused'
        ? 'warning'
        : job.status === 'Completed'
          ? 'success'
          : 'danger'
  ) as 'info' | 'warning' | 'success' | 'danger';

  // React to nextBatchTime and job.status changes
  $: updateCountdownCalculation(job.nextBatchTime, job.status);

  function updateCountdownCalculation(nextBatchTime?: string, status?: string) {
    if (!browser) return;
    stopCountdownTimer();

    if (status !== 'Running' || !nextBatchTime) {
      countdownText = '';
      countdownSeconds = 0;
      return;
    }

    const targetTime = new Date(nextBatchTime).getTime();
    if (isNaN(targetTime)) {
      countdownText = '';
      return;
    }

    const calculateRemaining = () => {
      const now = Date.now();
      const diffMs = targetTime - now;
      if (diffMs <= 0) {
        countdownText = 'Sending next batch now...';
        countdownSeconds = 0;
        return;
      }

      countdownSeconds = Math.ceil(diffMs / 1000);
      const hours = Math.floor(countdownSeconds / 3600);
      const minutes = Math.floor((countdownSeconds % 3600) / 60);
      const seconds = countdownSeconds % 60;

      if (hours > 0) {
        countdownText = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        countdownText = `${minutes}m ${seconds}s`;
      } else {
        countdownText = `${seconds}s`;
      }
    };

    calculateRemaining();
    countdownTimer = setInterval(calculateRemaining, 1000);
  }

  function stopCountdownTimer() {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  onMount(() => {
    updateCountdownCalculation(job.nextBatchTime, job.status);
  });

  onDestroy(() => {
    stopCountdownTimer();
  });

  async function handlePause() {
    if (actionLoading || job.status !== 'Running') return;
    actionLoading = 'pause';
    errorMessage = null;

    try {
      const res = await pauseBatch();
      addToast(res.message || 'Batch campaign paused.', 'info', 'Batch Paused');
      addActivity('info', `Batch campaign #${job.id.slice(0, 8)} paused.`);
      triggerStateCheck();
      dispatch('actionComplete');
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to pause batch campaign.';
      addToast(errorMessage, 'danger', 'Pause Error');
    } finally {
      actionLoading = null;
    }
  }

  async function handleResume() {
    if (actionLoading || job.status !== 'Paused') return;
    actionLoading = 'resume';
    errorMessage = null;

    try {
      const res = await resumeBatch();
      addToast(res.message || 'Batch campaign resumed.', 'success', 'Batch Resumed');
      addActivity('started', `Batch campaign #${job.id.slice(0, 8)} resumed.`);
      triggerStateCheck();
      dispatch('actionComplete');
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to resume batch campaign.';
      addToast(errorMessage, 'danger', 'Resume Error');
    } finally {
      actionLoading = null;
    }
  }

  async function handleConfirmCancel() {
    showCancelConfirm = false;
    actionLoading = 'cancel';
    errorMessage = null;

    try {
      const res = await cancelBatch();
      addToast(res.message || 'Batch campaign cancelled.', 'warning', 'Batch Cancelled');
      addActivity('completed', `Batch campaign #${job.id.slice(0, 8)} was cancelled.`);
      triggerStateCheck();
      dispatch('actionComplete');
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Failed to cancel batch campaign.';
      addToast(errorMessage, 'danger', 'Cancel Error');
    } finally {
      actionLoading = null;
    }
  }
</script>

<Card>
  <div class="batch-monitor">
    <!-- Header -->
    <div class="header">
      <div class="title-group">
        <div class="title-row">
          <span class="live-dot" class:pulsing={job.status === 'Running'}></span>
          <h2 class="title">Active Batch Campaign</h2>
          <Badge variant={statusVariant} text={job.status} />
        </div>
        <div class="meta-row">
          <span class="meta-item">
            <strong>Job ID:</strong> <code class="job-id">{job.id}</code>
          </span>
          {#if job.configName}
            <span class="meta-divider">•</span>
            <span class="meta-item">
              <strong>SMTP:</strong> {job.configName}
            </span>
          {/if}
          {#if job.startTime}
            <span class="meta-divider">•</span>
            <span class="meta-item">
              <strong>Started:</strong> {new Date(job.startTime).toLocaleTimeString()}
            </span>
          {/if}
        </div>
      </div>

      <!-- Action Controls -->
      <div class="actions">
        {#if job.status === 'Running'}
          <Button
            variant="secondary"
            loading={actionLoading === 'pause'}
            disabled={actionLoading !== null}
            onClick={handlePause}
          >
            ⏸️ Pause Batch
          </Button>
        {:else if job.status === 'Paused'}
          <Button
            variant="primary"
            loading={actionLoading === 'resume'}
            disabled={actionLoading !== null}
            onClick={handleResume}
          >
            ▶️ Resume Batch
          </Button>
        {/if}

        {#if job.status === 'Running' || job.status === 'Paused'}
          <Button
            variant="danger"
            loading={actionLoading === 'cancel'}
            disabled={actionLoading !== null}
            onClick={() => (showCancelConfirm = true)}
          >
            ⏹️ Cancel Batch
          </Button>
        {/if}
      </div>
    </div>

    {#if errorMessage}
      <div class="error-banner">
        <Alert variant="danger" title="Batch Control Error">
          {errorMessage}
        </Alert>
      </div>
    {/if}

    <!-- Progress Bar Section -->
    <div class="progress-section">
      <div class="progress-labels">
        <span class="progress-title">
          Overall Delivery Progress
        </span>
        <span class="progress-percent">
          <strong>{percent}%</strong> ({processedCount} of {totalContacts} contacts)
        </span>
      </div>

      <div
        class="progress-track"
        role="progressbar"
        aria-label="Batch Delivery Progress"
        aria-valuenow={processedCount}
        aria-valuemin="0"
        aria-valuemax={totalContacts}
      >
        <div
          class="progress-fill"
          class:paused={job.status === 'Paused'}
          class:completed={job.status === 'Completed'}
          class:failed={job.status === 'Failed'}
          style="width: {percent}%"
        ></div>
      </div>
    </div>

    <!-- Status Details Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Batch Position</span>
        <span class="metric-value highlight">
          {job.currentBatch} <span class="metric-total">/ {job.totalBatches}</span>
        </span>
        <span class="metric-subtext">
          {job.config?.batchSize || 20} emails per batch
        </span>
      </div>

      <div class="metric-card">
        <span class="metric-label">Emails Sent</span>
        <span class="metric-value success">{sentCount}</span>
        <span class="metric-subtext">Delivered successfully</span>
      </div>

      <div class="metric-card">
        <span class="metric-label">Emails Failed</span>
        <span class="metric-value danger">{failedCount}</span>
        <span class="metric-subtext">SMTP delivery errors</span>
      </div>

      <div class="metric-card">
        <span class="metric-label">Batch Parameters</span>
        <span class="metric-value small">
          {job.config?.emailDelay || 45}s / {job.config?.batchDelay || 60}m
        </span>
        <span class="metric-subtext">Delay per email / Pause per batch</span>
      </div>
    </div>

    <!-- Next Batch Countdown / Status Notice -->
    {#if countdownText && job.status === 'Running'}
      <div class="countdown-banner">
        <div class="countdown-icon">⏱️</div>
        <div class="countdown-content">
          <span class="countdown-title">Next Batch Scheduled:</span>
          <span class="countdown-time">{countdownText}</span>
          <span class="countdown-note">
            (Batch pause of {job.config?.batchDelay || 60} minutes is currently running to protect sender reputation)
          </span>
        </div>
      </div>
    {:else if job.status === 'Paused'}
      <div class="paused-banner">
        <div class="paused-icon">⏸️</div>
        <div class="paused-content">
          <strong>Campaign is currently paused.</strong> Click "Resume Batch" when ready to continue dispatching remaining batches.
        </div>
      </div>
    {/if}
  </div>
</Card>

<!-- Confirm Cancel Modal -->
<ConfirmDialog
  open={showCancelConfirm}
  title="Cancel Batch Campaign?"
  message="Are you sure you want to cancel this batch campaign? All remaining unsent contacts in this batch job will not be sent. This action cannot be undone."
  confirmLabel="Yes, Cancel Campaign"
  loading={actionLoading === 'cancel'}
  onCancel={() => (showCancelConfirm = false)}
  onConfirm={handleConfirmCancel}
/>

<style>
  .batch-monitor {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .title-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .live-dot {
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 50%;
    background-color: var(--color-muted);
  }

  .live-dot.pulsing {
    background-color: var(--color-primary);
    box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.6);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(79, 70, 229, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
    }
  }

  .title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .meta-row {
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

  .job-id {
    font-family: monospace;
    font-size: 0.75rem;
    padding: 0.125rem 0.25rem;
    background: var(--color-bg);
    border-radius: 4px;
    border: 1px solid var(--color-border);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .error-banner {
    margin-bottom: var(--space-2);
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  .progress-title {
    font-weight: 500;
    color: var(--color-text);
  }

  .progress-percent {
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  .progress-track {
    height: 0.875rem;
    width: 100%;
    background-color: var(--color-bg-secondary, #f1f5f9);
    border-radius: 9999px;
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4f46e5 0%, #6366f1 100%);
    border-radius: 9999px;
    transition: width 300ms ease;
  }

  .progress-fill.paused {
    background: linear-gradient(90deg, #d97706 0%, #f59e0b 100%);
  }

  .progress-fill.completed {
    background: linear-gradient(90deg, #059669 0%, #10b981 100%);
  }

  .progress-fill.failed {
    background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-3);
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: var(--space-3);
    background-color: var(--color-bg-secondary, #f8fafc);
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  .metric-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .metric-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .metric-value.highlight {
    color: var(--color-primary);
  }

  .metric-value.success {
    color: #059669;
  }

  .metric-value.danger {
    color: #dc2626;
  }

  .metric-value.small {
    font-size: 0.9375rem;
  }

  .metric-total {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-muted);
  }

  .metric-subtext {
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .countdown-banner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    color: #1e40af;
  }

  .countdown-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .countdown-content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
  }

  .countdown-title {
    font-weight: 500;
  }

  .countdown-time {
    font-weight: 700;
    color: #1d4ed8;
    background: #dbeafe;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }

  .countdown-note {
    font-size: 0.75rem;
    color: #3b82f6;
  }

  .paused-banner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    color: #92400e;
    font-size: 0.875rem;
  }

  .paused-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }
</style>
