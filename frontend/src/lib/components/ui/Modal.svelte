<script lang="ts">
  import { tick } from 'svelte';
  import { X } from 'lucide-svelte';
  import { uid } from '$lib/utils/uid';

  const titleId = uid('modal-title');
  export let open = false;
  export let title = '';
  export let closeLabel = 'Close dialog';
  export let onClose: (() => void) | undefined = undefined;
  let dialog: HTMLElement;
  let previousFocus: HTMLElement | null = null;

  async function focusDialog() {
    if (!open || typeof document === 'undefined') return;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    await tick();
    dialog?.focus();
  }

  $: if (open) void focusDialog();

  function close() {
    onClose?.();
    previousFocus?.focus();
  }
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function backdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) close();
  }
</script>

{#if open}
  <div class="backdrop" role="presentation" on:click={backdrop}>
    <div
      bind:this={dialog}
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
      on:keydown={handleKeydown}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button type="button" aria-label={closeLabel} title={closeLabel} on:click={close}
          ><X size={20} /></button
        >
      </header>
      <div class="content"><slot /></div>
      {#if $$slots.footer}<footer><slot name="footer" /></footer>{/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    z-index: 50;
    inset: 0;
    display: grid;
    place-items: center;
    padding: var(--space-4);
    background: rgb(24 34 53 / 48%);
  }
  .dialog {
    width: min(100%, 36rem);
    max-height: calc(100vh - 2rem);
    overflow: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
  }
  header,
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
  }
  header {
    border-bottom: 1px solid var(--color-border);
  }
  footer {
    border-top: 1px solid var(--color-border);
  }
  h2 {
    margin: 0;
    font-size: 1.125rem;
  }
  header button {
    display: grid;
    place-items: center;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-foreground);
    cursor: pointer;
  }
  header button:hover {
    background: var(--color-background);
  }
  .content {
    padding: var(--space-5);
  }
</style>
