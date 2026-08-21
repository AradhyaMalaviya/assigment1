<script lang="ts">
  import { testSmtpConnection } from '$lib/api/config';
  import { ApiError } from '$lib/api/client';
  import Button from '$lib/components/ui/Button.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import type { SmtpTestPayload } from '$lib/types/forms';

  export let payload: SmtpTestPayload | null;
  export let blockedReason: string;

  let testing = false;
  let result: { ok: boolean; message: string } | null = null;

  async function runTest() {
    if (!payload) {
      result = { ok: false, message: blockedReason };
      return;
    }
    testing = true;
    result = null;
    try {
      const response = await testSmtpConnection(payload);
      result = { ok: true, message: response.message };
    } catch (err) {
      result = { ok: false, message: err instanceof ApiError ? err.message : 'Unable to test the connection.' };
    } finally {
      testing = false;
    }
  }
</script>

<div class="test-connection">
  <Button type="button" variant="secondary" loading={testing} onClick={runTest}>Test connection</Button>
  {#if result}
    <div class="result">
      <Alert variant={result.ok ? 'success' : 'danger'}>{result.message}</Alert>
    </div>
  {/if}
</div>

<style>
  .test-connection {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .result {
    margin-top: var(--space-1);
  }
</style>
