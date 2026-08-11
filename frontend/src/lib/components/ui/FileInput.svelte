<script lang="ts">
  import { X } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  import { uid } from '$lib/utils/uid';

  const dispatch = createEventDispatcher<{ change: File | null }>();
  let input: HTMLInputElement;
  export let id = uid('file-input');
  export let label = 'Choose a file';
  export let accept: string | undefined = undefined;
  export let disabled = false;
  export let file: File | null = null;
  export let selectedFileName: string | undefined = undefined;

  function updateFile() {
    file = input.files?.[0] ?? null;
    selectedFileName = undefined;
    dispatch('change', file);
  }
  function clear() {
    input.value = '';
    file = null;
    selectedFileName = undefined;
    dispatch('change', null);
  }
</script>

<div class="file-field">
  <label for={id}>{label}</label>
  <input bind:this={input} {id} type="file" {accept} {disabled} on:change={updateFile} />
  {#if file || selectedFileName}
    <div class="selected">
      <span>{file?.name ?? selectedFileName}</span><button
        type="button"
        on:click={clear}
        aria-label="Clear selected file"
        title="Clear selected file"><X size={16} /></button
      >
    </div>
  {/if}
</div>

<style>
  .file-field {
    display: grid;
    gap: var(--space-2);
  }
  label {
    font-size: 0.875rem;
    font-weight: 650;
  }
  input {
    max-width: 100%;
    color: var(--color-muted);
  }
  .selected {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    font-size: 0.875rem;
  }
  .selected span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  button {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-foreground);
    cursor: pointer;
  }
  button:hover {
    background: var(--color-background);
  }
</style>
