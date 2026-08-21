<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { RecipientRangeInput } from '$lib/types/forms';
  import { computeRecipientRange } from '$lib/utils/range';

  const dispatch = createEventDispatcher<{
    change: RecipientRangeInput;
  }>();

  export let totalContactCount: number = 0;
  export let input: RecipientRangeInput = {
    mode: 'all',
    firstCount: 1,
    rangeStart: 1,
    rangeEnd: 1
  };
  export let disabled: boolean = false;

  $: isControlDisabled = disabled || totalContactCount <= 0;
  $: computed = computeRecipientRange(input, totalContactCount);

  function updateMode(mode: 'all' | 'first' | 'custom') {
    input = {
      ...input,
      mode,
      firstCount: input.firstCount || Math.min(5, totalContactCount || 1),
      rangeStart: input.rangeStart || 1,
      rangeEnd: input.rangeEnd || Math.min(5, totalContactCount || 1)
    };
    dispatch('change', input);
  }

  function handleFirstCountChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    input = { ...input, firstCount: Number.isNaN(val) ? undefined : val };
    dispatch('change', input);
  }

  function handleStartChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    input = { ...input, rangeStart: Number.isNaN(val) ? undefined : val };
    dispatch('change', input);
  }

  function handleEndChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    input = { ...input, rangeEnd: Number.isNaN(val) ? undefined : val };
    dispatch('change', input);
  }
</script>

<div class="range-selector" class:disabled={isControlDisabled}>
  <span class="section-label">
    Recipient Range Selection <span class="required">*</span>
  </span>

  {#if totalContactCount <= 0}
    <p class="disabled-hint">Please upload and parse a valid Excel contacts file to choose a recipient range.</p>
  {:else}
    <fieldset class="modes-fieldset">
      <legend class="sr-only">Choose Recipient Range Mode</legend>

      <!-- Option 1: All contacts -->
      <label class="mode-option">
        <input
          type="radio"
          name="range-mode"
          value="all"
          checked={input.mode === 'all'}
          on:change={() => updateMode('all')}
          disabled={isControlDisabled}
        />
        <span class="mode-text">All contacts ({totalContactCount} recipient{totalContactCount === 1 ? '' : 's'})</span>
      </label>

      <!-- Option 2: First N contacts -->
      <div class="mode-option-group">
        <label class="mode-option">
          <input
            type="radio"
            name="range-mode"
            value="first"
            checked={input.mode === 'first'}
            on:change={() => updateMode('first')}
            disabled={isControlDisabled}
          />
          <span class="mode-text">First N contacts</span>
        </label>

        {#if input.mode === 'first'}
          <div class="mode-inputs">
            <label for="first-count-input" class="inline-label">Send to first:</label>
            <input
              id="first-count-input"
              type="number"
              min="1"
              max={totalContactCount}
              value={input.firstCount ?? 1}
              on:input={handleFirstCountChange}
              disabled={isControlDisabled}
              class="num-input"
            />
            <span class="inline-unit">contacts</span>
          </div>
        {/if}
      </div>

      <!-- Option 3: Specific row range -->
      <div class="mode-option-group">
        <label class="mode-option">
          <input
            type="radio"
            name="range-mode"
            value="custom"
            checked={input.mode === 'custom'}
            on:change={() => updateMode('custom')}
            disabled={isControlDisabled}
          />
          <span class="mode-text">Specific row range (inclusive 1-based)</span>
        </label>

        {#if input.mode === 'custom'}
          <div class="mode-inputs flex-wrap">
            <div class="field-pair">
              <label for="range-start-input" class="inline-label">From row:</label>
              <input
                id="range-start-input"
                type="number"
                min="1"
                max={totalContactCount}
                value={input.rangeStart ?? 1}
                on:input={handleStartChange}
                disabled={isControlDisabled}
                class="num-input"
              />
            </div>
            <div class="field-pair">
              <label for="range-end-input" class="inline-label">To row:</label>
              <input
                id="range-end-input"
                type="number"
                min="1"
                max={totalContactCount}
                value={input.rangeEnd ?? 1}
                on:input={handleEndChange}
                disabled={isControlDisabled}
                class="num-input"
              />
            </div>
          </div>
        {/if}
      </div>
    </fieldset>

    <!-- Live summary sentence & validation error -->
    <div class="summary-box" class:error={!computed.isValid}>
      {#if computed.isValid}
        <span class="summary-icon">✅</span>
        <span class="summary-text">
          Will send to <strong>{computed.count}</strong> of {totalContactCount} contact{totalContactCount === 1 ? '' : 's'}
          (rows {computed.start + 1} to {computed.end}).
        </span>
      {:else}
        <span class="summary-icon">⚠️</span>
        <span class="summary-text">{computed.errorMessage}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .range-selector {
    display: grid;
    gap: var(--space-2, 0.5rem);
  }
  .range-selector.disabled {
    opacity: 0.7;
  }
  .section-label {
    font-weight: 650;
    font-size: 0.875rem;
    color: var(--color-foreground, #1e293b);
  }
  .required {
    color: #ef4444;
  }
  .disabled-hint {
    font-size: 0.84375rem;
    color: var(--color-muted, #64748b);
    margin: 0;
  }
  .modes-fieldset {
    border: 1px solid var(--color-border, #cbd5e1);
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.75rem;
    background: var(--color-surface, #ffffff);
    display: grid;
    gap: 0.75rem;
    margin: 0;
  }
  .mode-option-group {
    display: grid;
    gap: 0.375rem;
  }
  .mode-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #1e293b;
  }
  .mode-text {
    font-weight: 500;
  }
  .mode-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 1.5rem;
    background: #f8fafc;
    padding: 0.375rem 0.625rem;
    border-radius: 0.25rem;
    border: 1px solid #e2e8f0;
  }
  .flex-wrap {
    flex-wrap: wrap;
  }
  .field-pair {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .inline-label {
    font-size: 0.8125rem;
    color: #475569;
    font-weight: 500;
  }
  .inline-unit {
    font-size: 0.8125rem;
    color: #64748b;
  }
  .num-input {
    width: 4.5rem;
    padding: 0.25rem 0.375rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
  .summary-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.84375rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }
  .summary-box.error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
