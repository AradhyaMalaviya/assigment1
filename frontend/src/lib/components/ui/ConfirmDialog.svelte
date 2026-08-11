<script lang="ts">
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';

  export let open = false;
  export let title = 'Confirm action';
  export let message = '';
  export let confirmLabel = 'Confirm';
  export let loading = false;
  export let onCancel: (() => void) | undefined = undefined;
  export let onConfirm: (() => void) | undefined = undefined;
</script>

<Modal {open} {title} onClose={onCancel}>
  <p>{message}</p>
  <svelte:fragment slot="footer">
    <div class="actions">
      <Button variant="secondary" onClick={onCancel}>Cancel</Button><Button
        variant="danger"
        {loading}
        onClick={onConfirm}>{confirmLabel}</Button
      >
    </div>
  </svelte:fragment>
</Modal>

<style>
  p {
    margin: 0;
    line-height: 1.5;
  }
  .actions {
    display: flex;
    width: 100%;
    justify-content: flex-end;
    gap: var(--space-3);
  }
</style>
