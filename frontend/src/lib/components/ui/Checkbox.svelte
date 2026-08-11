<script lang="ts">
  import { uid } from '$lib/utils/uid';

  export let id = uid('checkbox-field');
  export let label = '';
  export let checked = false;
  export let disabled = false;
  export let hint: string | undefined = undefined;
</script>

<div class="checkbox-field">
  <input
    {id}
    type="checkbox"
    bind:checked
    {disabled}
    aria-describedby={hint ? `${id}-hint` : undefined}
  />
  <label for={id}>{label}</label>
  {#if hint}<p id={`${id}-hint`}>{hint}</p>{/if}
</div>

<style>
  .checkbox-field {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
  input {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
  }
  label {
    font-size: 0.875rem;
    font-weight: 600;
  }
  p {
    width: 100%;
    margin: 0 0 0 1.5rem;
    color: var(--color-muted);
    font-size: 0.8125rem;
  }
</style>
