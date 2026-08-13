<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte';
  import { formatDateTime } from '$lib/utils/formatters';
  import type { SmtpConfig } from '$lib/types/api';
  export let config: SmtpConfig;
</script>

<dl class="details">
  <div><dt>Name</dt><dd>{config.name || '—'}</dd></div>
  <div><dt>SMTP host</dt><dd>{config.host}</dd></div>
  <div><dt>Port</dt><dd>{config.port}</dd></div>
  <div><dt>Security</dt><dd><Badge variant={config.secure ? 'success' : 'warning'} text={config.secure ? 'TLS/SSL enabled' : 'No encryption'} /></dd></div>
  <div><dt>Username</dt><dd>{config.user}</dd></div>
  <!-- Hardcoded, not derived: GET /config/smtp's userConfigs[] entries never include
       `pass` at all (config.ts:56-67 strips it), so there is nothing to mask. -->
  <div><dt>Password</dt><dd>••••••••••••</dd></div>
  <div><dt>From email</dt><dd>{config.fromEmail}</dd></div>
  <div><dt>From name</dt><dd>{config.fromName || '—'}</dd></div>
  <div><dt>Default</dt><dd><Badge variant={config.isDefault ? 'success' : 'info'} text={config.isDefault ? 'Yes' : 'No'} /></dd></div>
  {#if config.createdAt}<div><dt>Created</dt><dd>{formatDateTime(config.createdAt)}</dd></div>{/if}
</dl>

<style>
  .details {
    display: grid;
    gap: var(--space-4);
    margin: 0;
  }
  .details div {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: var(--space-3);
    align-items: center;
  }
  dt {
    color: var(--color-muted);
    font-size: 0.8125rem;
    font-weight: 650;
  }
  dd {
    margin: 0;
    font-size: 0.9375rem;
    word-break: break-word;
  }
</style>
