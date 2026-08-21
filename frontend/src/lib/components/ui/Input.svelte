<script lang="ts">
  import { uid } from '$lib/utils/uid';

  export let id = uid('input-field');
  export let label = '';
  export let hint: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let value = '';
  export let type = 'text';
  export let placeholder = '';
  export let disabled = false;
  export let required = false;
  export let name: string | undefined = undefined;
</script>

<div class="field">
  {#if label}<label for={id}
      >{label}{#if required}<span aria-hidden="true"> *</span>{/if}</label
    >{/if}
  <input
    {id}
    {type}
    {placeholder}
    {disabled}
    {required}
    {name}
    bind:value
    aria-invalid={Boolean(error)}
    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
  />
  {#if hint && !error}<p id={`${id}-hint`} class="hint">{hint}</p>{/if}
  {#if error}<p id={`${id}-error`} class="error" role="alert">{error}</p>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: var(--space-2);
  }
  label {
    color: var(--color-foreground);
    font-size: 0.875rem;
    font-weight: 650;
  }
  input {
    width: 100%;
    min-width: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-foreground);
    padding: 0.625rem var(--space-3);
  }
  input[aria-invalid='true'] {
    border-color: var(--color-danger);
  }
  input:disabled {
    background: var(--color-background);
    color: var(--color-muted);
    cursor: not-allowed;
  }
  .hint,
  .error {
    margin: 0;
    font-size: 0.8125rem;
  }
  .hint {
    color: var(--color-muted);
  }
  .error {
    color: var(--color-danger);
  }
</style>
