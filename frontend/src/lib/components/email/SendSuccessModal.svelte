<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { SendResponse } from '$lib/types/api';

  export let open: boolean = false;
  export let response: SendResponse | null = null;
  export let configName: string = '';
  export let notifyBrowser: boolean = false;

  const dispatch = createEventDispatcher<{
    close: void;
    composeAnother: void;
  }>();

  $: isScheduled = !!response && 'scheduledMode' in response && response.scheduledMode === true;
  $: isBatch = !!response && 'batchMode' in response && response.batchMode === true && !isScheduled;
  $: isImmediate = !!response && !isScheduled && !isBatch;

  $: if (open && response && isScheduled && notifyBrowser && browser && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification('📅 Email Campaign Scheduled', {
          body: response.message || `Your campaign for ${response.contactCount} contacts has been scheduled.`,
          icon: '/favicon.png'
        });
      } catch {
        // Ignore desktop notification creation errors
      }
    }
  }

  function handleClose() {
    dispatch('close');
  }

  function handleComposeAnother() {
    dispatch('composeAnother');
  }

  function handleGoToReports() {
    dispatch('close');
    goto('/reports');
  }

  function handleGoToDashboard() {
    dispatch('close');
    goto('/dashboard');
  }
</script>

<Modal
  {open}
  title={isScheduled ? '📅 Campaign Scheduled' : isBatch ? '⚡ Batch Campaign Dispatched' : '🚀 Campaign Started'}
  on:close={handleClose}
>
  {#if response}
    <div class="success-modal-content">
      <div class="status-hero">
        <div class="hero-icon">
          {#if isScheduled}
            📅
          {:else if isBatch}
            ⚡
          {:else}
            🚀
          {/if}
        </div>
        <h3 class="hero-title">
          {#if isScheduled}
            Campaign Successfully Scheduled!
          {:else if isBatch}
            Batch Processing Underway!
          {:else}
            Bulk Email Sending Started!
          {/if}
        </h3>
        <p class="hero-message">{response.message}</p>
      </div>

      <div class="details-card">
        <h4 class="details-heading">Campaign Dispatch Details:</h4>
        <dl class="details-list">
          <div class="detail-row">
            <dt>Recipients:</dt>
            <dd><strong>{response.contactCount}</strong> contact{response.contactCount === 1 ? '' : 's'}</dd>
          </div>

          <div class="detail-row">
            <dt>SMTP Configuration:</dt>
            <dd>{response.configUsed || configName}</dd>
          </div>

          {#if isScheduled && 'scheduledTime' in response}
            <div class="detail-row">
              <dt>Scheduled Time (Local):</dt>
              <dd><strong>{new Date(response.scheduledTime).toLocaleString()}</strong></dd>
            </div>
            <div class="detail-row">
              <dt>Scheduled Time (UTC):</dt>
              <dd><code>{response.scheduledTime}</code></dd>
            </div>
            <div class="detail-row">
              <dt>Delivery Mode:</dt>
              <dd>{response.batchMode ? 'Batch Delivery (Scheduled)' : 'Direct Delivery (Scheduled)'}</dd>
            </div>
            <div class="detail-row">
              <dt>Scheduled Job ID:</dt>
              <dd><code>{response.jobId}</code></dd>
            </div>
          {/if}

          {#if isBatch && 'batchConfig' in response}
            <div class="detail-row">
              <dt>Batch Size:</dt>
              <dd>{response.batchConfig.batchSize} emails per cycle</dd>
            </div>
            <div class="detail-row">
              <dt>Batch Pause:</dt>
              <dd>{response.batchConfig.batchDelay} minutes</dd>
            </div>
            <div class="detail-row">
              <dt>Email Delay:</dt>
              <dd>{response.batchConfig.emailDelay} seconds</dd>
            </div>
            {#if 'jobId' in response}
              <div class="detail-row">
                <dt>Batch Job ID:</dt>
                <dd><code>{response.jobId}</code></dd>
              </div>
            {/if}
          {/if}

          {#if isImmediate}
            <div class="detail-row">
              <dt>Delivery Pipeline:</dt>
              <dd>Direct sequential delivery in background</dd>
            </div>
          {/if}
        </dl>
      </div>

      <div class="next-steps-info">
        {#if isScheduled}
          <p>
            ℹ️ You can review, monitor, or cancel this queued campaign in the <strong>Scheduled Jobs</strong> section anytime before its scheduled launch.
          </p>
        {:else if isBatch}
          <p>
            ℹ️ You can watch real-time batch progress, pause, resume, or cancel this batch job on the <strong>Dashboard</strong>.
          </p>
        {:else}
          <p>
            ℹ️ Delivery outcomes and sent message logs will be recorded in real-time in the <strong>Reports</strong> tab.
          </p>
        {/if}
      </div>
    </div>
  {/if}

  <svelte:fragment slot="footer">
    <div class="modal-actions">
      <Button variant="ghost" on:click={handleComposeAnother}>
        Compose Another
      </Button>
      <Button variant="secondary" on:click={handleGoToDashboard}>
        📈 Dashboard
      </Button>
      <Button variant="primary" on:click={handleGoToReports}>
        📊 View Reports
      </Button>
    </div>
  </svelte:fragment>
</Modal>

<style>
  .success-modal-content {
    display: grid;
    gap: 1.25rem;
  }
  .status-hero {
    text-align: center;
    padding: 0.5rem 0;
  }
  .hero-icon {
    font-size: 3rem;
    line-height: 1;
    margin-bottom: 0.5rem;
  }
  .hero-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-foreground, #0f172a);
    margin: 0 0 0.25rem 0;
  }
  .hero-message {
    font-size: 0.9375rem;
    color: var(--color-muted, #64748b);
    margin: 0;
  }
  .details-card {
    background: #f8fafc;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-md, 0.375rem);
    padding: 1rem;
    display: grid;
    gap: 0.5rem;
  }
  .details-heading {
    font-size: 0.875rem;
    font-weight: 650;
    color: var(--color-foreground, #0f172a);
    margin: 0 0 0.25rem 0;
  }
  .details-list {
    margin: 0;
    display: grid;
    gap: 0.375rem;
    font-size: 0.875rem;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 0.25rem;
  }
  .detail-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  dt {
    color: var(--color-muted, #64748b);
  }
  dd {
    margin: 0;
    color: var(--color-foreground, #0f172a);
    text-align: right;
  }
  code {
    background: #f1f5f9;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.8125rem;
  }
  .next-steps-info {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
    color: #166534;
  }
  .next-steps-info p {
    margin: 0;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    width: 100%;
  }
</style>
