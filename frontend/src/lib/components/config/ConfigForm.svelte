<script lang="ts">
  import { createConfig, updateConfig } from '$lib/api/config';
  import { ApiError } from '$lib/api/client';
  import Input from '$lib/components/ui/Input.svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import ProviderHelp from './ProviderHelp.svelte';
  import TestConnectionButton from './TestConnectionButton.svelte';
  import { validateSmtpConfigForm } from '$lib/utils/validation';
  import { processSmtpPassword, validateGmailPassword } from '$lib/utils/smtpPassword';
  import type { SmtpConfig } from '$lib/types/api';
  import type { SmtpConfigForm as SmtpConfigPayload, SmtpTestPayload } from '$lib/types/forms';

  export let mode: 'create' | 'edit';
  export let initial: SmtpConfig | undefined = undefined;
  export let onSaved: () => void;
  export let onCancel: () => void;

  let name = initial?.name ?? '';
  let host = initial?.host ?? '';
  let port = initial ? String(initial.port) : '587';
  let secure = initial?.secure ?? false;
  let user = initial?.user ?? '';
  let pass = '';
  let fromEmail = initial?.fromEmail ?? '';
  let fromName = initial?.fromName ?? '';
  let isDefault = initial?.isDefault ?? false;

  let submitting = false;
  let errorMessage = '';

  $: portNumber = Number(port) || 587;
  $: passwordTyped = pass.trim().length > 0;
  $: testPayload = passwordTyped
    ? ({ host, port: portNumber, secure, user, pass: processSmtpPassword(pass, host) } as SmtpTestPayload)
    : null;
  $: testBlockedReason =
    mode === 'edit'
      ? 'Enter the password to test the connection. For security, the existing password is never sent back to the browser.'
      : 'Enter the SMTP password to test the connection.';

  async function handleSubmit() {
    errorMessage = '';
    const validationError = validateSmtpConfigForm(
      { host, user, fromEmail, pass },
      { requirePassword: mode === 'create' },
    );
    if (validationError) { errorMessage = validationError; return; }
    if (passwordTyped) {
      const gmailError = validateGmailPassword(pass, host);
      if (gmailError) { errorMessage = gmailError; return; }
    }

    const payload: SmtpConfigPayload = {
      name, host, port: portNumber, secure, user, fromEmail, fromName, isDefault,
      // Omit the key entirely when untouched — an empty string is a real value that
      // would overwrite the stored password (see planforphase5.md §2 note 2 / Risk R9).
      ...(passwordTyped ? { pass: processSmtpPassword(pass, host) } : {}),
    };

    submitting = true;
    try {
      if (mode === 'create') await createConfig(payload);
      else await updateConfig(initial!.id!, payload);
      onSaved();
    } catch (err) {
      errorMessage = err instanceof ApiError ? err.message : 'Unable to save the configuration.';
    } finally {
      submitting = false;
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} novalidate>
  {#if errorMessage}<Alert variant="danger">{errorMessage}</Alert>{/if}

  <div class="fields">
    <Input label="Configuration name" placeholder="e.g. Primary Gmail account" bind:value={name} disabled={submitting} />
    <Input label="SMTP host" bind:value={host} disabled={submitting} required />
    <div class="row">
      <Input label="Port" type="number" bind:value={port} disabled={submitting} placeholder="587" />
      <div class="checkbox-wrap">
        <Checkbox label="Use TLS/SSL" bind:checked={secure} disabled={submitting} />
      </div>
    </div>
    <Input label="Username" bind:value={user} disabled={submitting} required />
    <Input
      label="Password" type="password" bind:value={pass} disabled={submitting}
      required={mode === 'create'}
      hint={mode === 'edit' ? 'Leave blank to keep the current password.' : undefined}
    />
    <ProviderHelp {host} {mode} />
    <Input label="From email" type="email" bind:value={fromEmail} disabled={submitting} required />
    <Input label="From name" bind:value={fromName} disabled={submitting} />
    <Checkbox label="Set as default configuration" bind:checked={isDefault} disabled={submitting} />

    <TestConnectionButton payload={testPayload} blockedReason={testBlockedReason} />
  </div>

  <div class="actions">
    <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>
    <Button type="submit" loading={submitting}>{mode === 'create' ? 'Save configuration' : 'Save changes'}</Button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
  .fields {
    display: grid;
    gap: var(--space-4);
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    align-items: end;
  }
  .checkbox-wrap {
    display: flex;
    align-items: center;
    min-height: 2.5rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border);
  }
</style>
