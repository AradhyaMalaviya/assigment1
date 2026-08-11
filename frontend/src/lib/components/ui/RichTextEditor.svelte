<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { uid } from '$lib/utils/uid';

  const dispatch = createEventDispatcher<{ change: string }>();
  export let value = '';
  export let label = 'Message';
  export let placeholder = 'Write your message...';
  export let disabled = false;
  export let id = uid('rich-text-editor');

  function update() {
    dispatch('change', value);
  }
</script>

<div class="editor-shell">
  <label for={id}>{label}</label>
  <!-- This lightweight shell keeps the Phase 3 bundle editor-free; a feature editor can lazy-load behind this value/change contract. -->
  <textarea {id} bind:value {placeholder} {disabled} on:input={update}></textarea>
</div>

<style>
  .editor-shell {
    display: grid;
    gap: var(--space-2);
  }
  label {
    font-size: 0.875rem;
    font-weight: 650;
  }
  textarea {
    width: 100%;
    min-height: 11rem;
    resize: vertical;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-foreground);
    padding: var(--space-3);
    line-height: 1.5;
  }
  textarea:disabled {
    background: var(--color-background);
    color: var(--color-muted);
  }
</style>
