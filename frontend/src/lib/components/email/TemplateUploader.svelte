<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FileInput from '$lib/components/ui/FileInput.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  const dispatch = createEventDispatcher<{
    templateSelect: File | null;
    templateRead: string | null;
  }>();

  export let templateFile: File | null = null;
  export let disabled: boolean = false;

  let readError: string | null = null;

  function handleFileChange(event: CustomEvent<File | null>) {
    const file = event.detail;
    templateFile = file;
    readError = null;

    if (!file) {
      dispatch('templateSelect', null);
      dispatch('templateRead', null);
      return;
    }

    dispatch('templateSelect', file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      dispatch('templateRead', content ?? null);
    };
    reader.onerror = () => {
      readError = 'Failed to read HTML template file in browser.';
      dispatch('templateRead', null);
    };
    reader.readAsText(file);
  }

  function handleClear() {
    templateFile = null;
    readError = null;
    dispatch('templateSelect', null);
    dispatch('templateRead', null);
  }
</script>

<div class="template-uploader">
  <div class="uploader-header">
    <span class="uploader-title">HTML Template Upload (Optional)</span>
    <span class="uploader-hint">Upload a custom .html file if you prefer external HTML over the editor</span>
  </div>

  <FileInput
    label=""
    accept=".html, .htm, text/html"
    {disabled}
    on:change={handleFileChange}
  />

  {#if readError}
    <Alert variant="danger" title="Template Reading Error">{readError}</Alert>
  {:else if templateFile}
    <div class="template-active-card">
      <div class="card-info">
        <span class="active-icon">📄</span>
        <div class="active-text">
          <span class="file-name"><strong>{templateFile.name}</strong> ({(templateFile.size / 1024).toFixed(1)} KB)</span>
          <span class="precedence-note">
            ⚡ <strong>Precedence Notice:</strong> This uploaded HTML template will override the rich text editor content upon delivery.
          </span>
        </div>
      </div>
      <Button variant="ghost" on:click={handleClear} {disabled}>
        Remove Template
      </Button>
    </div>
  {/if}
</div>

<style>
  .template-uploader {
    display: grid;
    gap: var(--space-2, 0.5rem);
  }
  .uploader-header {
    display: flex;
    flex-direction: column;
  }
  .uploader-title {
    font-weight: 650;
    font-size: 0.875rem;
    color: var(--color-foreground, #1e293b);
  }
  .uploader-hint {
    font-size: 0.75rem;
    color: var(--color-muted, #64748b);
  }
  .template-active-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.625rem 0.75rem;
    font-size: 0.84375rem;
    color: #0369a1;
  }
  .card-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .active-icon {
    font-size: 1.25rem;
  }
  .active-text {
    display: grid;
    gap: 0.125rem;
  }
  .file-name {
    color: #0c4a6e;
  }
  .precedence-note {
    font-size: 0.75rem;
    color: #0284c7;
  }
</style>
