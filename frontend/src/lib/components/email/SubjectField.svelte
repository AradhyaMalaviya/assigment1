<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import PlaceholderHelp from './PlaceholderHelp.svelte';

  const dispatch = createEventDispatcher<{
    subjectChange: string;
    delayChange: number;
  }>();

  export let subject: string = '';
  export let delay: number = 20;
  export let disabled: boolean = false;

  const placeholderText = 'e.g. Special Offer for {{FirstName}} from {{Company}}';

  function handleSubjectInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    subject = val;
    dispatch('subjectChange', val);
  }

  function handleDelayInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    delay = Number.isNaN(val) ? 20 : val;
    dispatch('delayChange', delay);
  }
</script>

<div class="subject-section">
  <div class="field-wrapper">
    <Input
      label="Campaign Subject Line"
      required
      placeholder={placeholderText}
      value={subject}
      {disabled}
      on:input={handleSubjectInput}
    />
  </div>

  <div class="delay-wrapper">
    <label for="delay-input" class="delay-label">
      Sending Delay (Seconds per Email) <span class="required">*</span>
    </label>
    <div class="delay-input-row">
      <input
        id="delay-input"
        type="number"
        min="1"
        max="300"
        value={delay}
        on:input={handleDelayInput}
        {disabled}
        class="delay-num-input"
      />
      <span class="delay-hint">
        Recommended: 15–30 seconds to prevent rate limits or spam flagging.
      </span>
    </div>
  </div>

  <PlaceholderHelp compact />
</div>

<style>
  .subject-section {
    display: grid;
    gap: var(--space-3, 0.75rem);
  }
  .field-wrapper {
    display: grid;
    gap: 0.25rem;
  }
  .delay-wrapper {
    display: grid;
    gap: 0.25rem;
  }
  .delay-label {
    font-weight: 650;
    font-size: 0.875rem;
    color: var(--color-foreground, #1e293b);
  }
  .required {
    color: #ef4444;
  }
  .delay-input-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .delay-num-input {
    width: 6rem;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-border, #cbd5e1);
    border-radius: var(--radius-md, 0.375rem);
    background: var(--color-surface, #ffffff);
    font-size: 0.9375rem;
  }
  .delay-hint {
    font-size: 0.8125rem;
    color: var(--color-muted, #64748b);
  }
</style>
