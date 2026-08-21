<script lang="ts">
  import { invalidate } from '$app/navigation';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { ConfigList, ConfigForm, ConfigDetails } from '$lib/components/config';
  import { deleteConfig, setDefaultConfig } from '$lib/api/config';
  import { ApiError } from '$lib/api/client';
  import { addToast } from '$lib/stores/toast';
  import type { SmtpConfig } from '$lib/types/api';
  import type { PageData } from './$types';

  export let data: PageData;
  $: configs = data.configsResponse.userConfigs;
  $: hasEnvConfig = data.configsResponse.hasEnvConfig;

  type FormModalState = { mode: 'create' } | { mode: 'edit'; config: SmtpConfig } | null;
  let formModal: FormModalState = null;
  let viewing: SmtpConfig | null = null;
  let pendingDelete: SmtpConfig | null = null;
  let deleting = false;

  const refresh = () => invalidate('app:configs');

  async function handleSaved() {
    formModal = null;
    addToast('Configuration saved', 'success');
    await refresh();
  }
  function openEditFromView(config: SmtpConfig) {
    formModal = { mode: 'edit', config };
    viewing = null;
  }
  async function handleSetDefault(config: SmtpConfig) {
    try {
      await setDefaultConfig(config.id!);
      addToast('Default configuration updated', 'success');
      await refresh();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Failed to update the default configuration.', 'danger');
    }
  }
  async function confirmDelete() {
    if (!pendingDelete) return;
    deleting = true;
    try {
      await deleteConfig(pendingDelete.id!);
      addToast('Configuration deleted', 'success');
      pendingDelete = null;
      await refresh();
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Failed to delete the configuration.', 'danger');
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>SMTP Configurations | Bulk Email Sender</title>
</svelte:head>

<PageHeader title="SMTP configurations" description="Manage the accounts used to send campaigns.">
  <Button onClick={() => (formModal = { mode: 'create' })}>Add configuration</Button>
</PageHeader>

<ConfigList {configs} {hasEnvConfig}
  onCreate={() => (formModal = { mode: 'create' })}
  onView={(config) => (viewing = config)}
  onEdit={(config) => (formModal = { mode: 'edit', config })}
  onSetDefault={handleSetDefault}
  onDelete={(config) => (pendingDelete = config)} />

<Modal open={!!formModal} title={formModal?.mode === 'edit' ? 'Edit configuration' : 'Add configuration'}
  onClose={() => (formModal = null)}>
  {#if formModal}
    <ConfigForm mode={formModal.mode}
      initial={formModal.mode === 'edit' ? formModal.config : undefined}
      onSaved={handleSaved} onCancel={() => (formModal = null)} />
  {/if}
</Modal>

<Modal open={!!viewing} title="Configuration details" onClose={() => (viewing = null)}>
  {#if viewing}<ConfigDetails config={viewing} />{/if}
  <svelte:fragment slot="footer">
    <div class="detail-actions">
      <Button variant="secondary" onClick={() => (viewing = null)}>Close</Button>
      <Button onClick={() => viewing && openEditFromView(viewing)}>Edit</Button>
    </div>
  </svelte:fragment>
</Modal>

<ConfirmDialog open={!!pendingDelete} title="Delete configuration"
  message={pendingDelete
    ? `Delete "${pendingDelete.name}"?${pendingDelete.isDefault ? ' This is currently your default configuration.' : ''} This cannot be undone.`
    : ''}
  confirmLabel="Delete" loading={deleting}
  onCancel={() => (pendingDelete = null)} onConfirm={confirmDelete} />

<style>
  .detail-actions {
    display: flex;
    width: 100%;
    justify-content: flex-end;
    gap: var(--space-3);
  }
</style>
