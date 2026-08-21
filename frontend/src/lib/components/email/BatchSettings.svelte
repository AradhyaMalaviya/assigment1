<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';

  export let useBatch: boolean = false;
  export let batchSize: number = 20;
  export let batchDelay: number = 60; // in minutes
  export let emailDelay: number = 45; // in seconds
  export let recipientCount: number = 0;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    change: {
      useBatch: boolean;
      batchSize: number;
      batchDelay: number;
      emailDelay: number;
    };
  }>();

  $: isBatchSizeValid = Number.isInteger(batchSize) && batchSize >= 1;
  $: isBatchDelayValid = Number.isInteger(batchDelay) && batchDelay >= 1;
  $: isEmailDelayValid = Number.isInteger(emailDelay) && emailDelay >= 1;

  $: effectiveCount = recipientCount > 0 ? recipientCount : 100;
  $: effectiveBatchSize = isBatchSizeValid ? batchSize : 20;
  $: effectiveBatchDelay = isBatchDelayValid ? batchDelay : 60;
  $: effectiveEmailDelay = isEmailDelayValid ? emailDelay : 45;

  $: totalBatches = Math.max(1, Math.ceil(effectiveCount / effectiveBatchSize));
  $: totalTimeHours = ((totalBatches - 1) * effectiveBatchDelay) / 60 + ((effectiveCount * effectiveEmailDelay) / 3600);

  function notifyChange() {
    dispatch('change', {
      useBatch,
      batchSize,
      batchDelay,
      emailDelay
    });
  }

  function handleToggleBatch() {
    notifyChange();
  }

  function handleBatchSizeInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    batchSize = isNaN(val) ? 0 : val;
    notifyChange();
  }

  function handleBatchDelayInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    batchDelay = isNaN(val) ? 0 : val;
    notifyChange();
  }

  function handleEmailDelayInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    emailDelay = isNaN(val) ? 0 : val;
    notifyChange();
  }
</script>

<div class="batch-settings-container">
  <div class="toggle-row">
    <Checkbox
      id="use-batch-toggle"
      label="Enable Batch Processing (Recommended for large campaigns)"
      hint="Distributes outbound email delivery into smaller chunks with pauses to prevent provider rate-limiting and mailbox penalties."
      bind:checked={useBatch}
      {disabled}
      on:change={handleToggleBatch}
    />
  </div>

  {#if useBatch}
    <div class="settings-grid">
      <div class="setting-item">
        <label for="batch-size-input">Batch Size (Emails)</label>
        <input
          id="batch-size-input"
          type="number"
          min="1"
          step="1"
          value={batchSize}
          {disabled}
          on:input={handleBatchSizeInput}
          class:invalid={!isBatchSizeValid}
        />
        <p class="field-hint">Number of emails per sending cycle (default: 20).</p>
        {#if !isBatchSizeValid}
          <p class="field-error" role="alert">Batch size must be a positive whole number (>= 1).</p>
        {/if}
      </div>

      <div class="setting-item">
        <label for="batch-delay-input">Pause Between Batches (Minutes)</label>
        <input
          id="batch-delay-input"
          type="number"
          min="1"
          step="1"
          value={batchDelay}
          {disabled}
          on:input={handleBatchDelayInput}
          class:invalid={!isBatchDelayValid}
        />
        <p class="field-hint">Cool-down pause between batches in minutes (default: 60 min).</p>
        {#if !isBatchDelayValid}
          <p class="field-error" role="alert">Batch pause must be a positive whole number (>= 1 min).</p>
        {/if}
      </div>

      <div class="setting-item">
        <label for="email-delay-input">Delay Between Emails (Seconds)</label>
        <input
          id="email-delay-input"
          type="number"
          min="1"
          step="1"
          value={emailDelay}
          {disabled}
          on:input={handleEmailDelayInput}
          class:invalid={!isEmailDelayValid}
        />
        <p class="field-hint">Pause between individual emails in seconds (default: 45 s).</p>
        {#if !isEmailDelayValid}
          <p class="field-error" role="alert">Email delay must be a positive whole number (>= 1 s).</p>
        {/if}
      </div>
    </div>

    <!-- Batch delivery estimation preview -->
    <div class="batch-preview-box">
      <div class="preview-header">
        <span class="preview-icon">⚡</span>
        <strong>Calculated Batch Schedule Preview:</strong>
      </div>
      <div class="preview-body">
        <p>
          📊 <strong>{effectiveCount} recipient{effectiveCount === 1 ? '' : 's'}</strong> ({recipientCount > 0 ? 'from selected range' : 'estimated'})
          → <strong>{totalBatches} batch{totalBatches === 1 ? '' : 'es'}</strong> of <strong>{effectiveBatchSize}</strong> emails
        </p>
        <p>
          ⏱️ Estimated campaign duration: <strong>~{totalTimeHours.toFixed(1)} hours</strong>
          ({effectiveEmailDelay}s between emails, {effectiveBatchDelay}min pause between batches)
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  .batch-settings-container {
    display: grid;
    gap: 1rem;
  }
  .toggle-row {
    padding-bottom: 0.25rem;
  }
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    background: #f8fafc;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-md, 0.375rem);
    padding: 1rem;
  }
  .setting-item {
    display: grid;
    gap: 0.375rem;
  }
  label {
    font-size: 0.8125rem;
    font-weight: 650;
    color: var(--color-foreground, #0f172a);
  }
  input {
    width: 100%;
    border: 1px solid var(--color-border, #cbd5e1);
    border-radius: var(--radius-md, 0.375rem);
    background: #ffffff;
    color: var(--color-foreground, #0f172a);
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  input:focus {
    outline: none;
    border-color: var(--color-primary, #667eea);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
  }
  input.invalid {
    border-color: var(--color-danger, #dc2626);
  }
  input:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
  .field-hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-muted, #64748b);
  }
  .field-error {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-danger, #dc2626);
    font-weight: 500;
  }
  .batch-preview-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    color: #1e3a8a;
    display: grid;
    gap: 0.375rem;
  }
  .preview-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .preview-icon {
    font-size: 1.125rem;
  }
  .preview-body {
    display: grid;
    gap: 0.25rem;
    margin-left: 1.625rem;
  }
  .preview-body p {
    margin: 0;
    line-height: 1.4;
  }
</style>
