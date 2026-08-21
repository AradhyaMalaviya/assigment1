<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FileInput from '$lib/components/ui/FileInput.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';

  const dispatch = createEventDispatcher<{
    fileSelect: File | null;
  }>();

  export let file: File | null = null;
  export let loadingParse: boolean = false;
  export let parseError: string | null = null;
  export let totalContactCount: number = 0;
  export let disabled: boolean = false;

  function handleFileChange(event: CustomEvent<File | null>) {
    dispatch('fileSelect', event.detail);
  }
</script>

<div class="contact-uploader">
  <div class="uploader-header">
    <div class="header-titles">
      <span class="uploader-title">Excel Recipients File <span class="required">*</span></span>
      <span class="uploader-hint">Upload an .xlsx file containing an Email column</span>
    </div>
    <a
      href="/samples/sample-contacts.xlsx"
      download="sample-contacts.xlsx"
      class="sample-download-link"
    >
      📥 Download Sample Excel
    </a>
  </div>

  <FileInput
    label=""
    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    {disabled}
    on:change={handleFileChange}
  />

  {#if loadingParse}
    <div class="parse-status loading">
      <Spinner size="sm" />
      <span>Parsing workbook and validating recipient email addresses...</span>
    </div>
  {:else if parseError}
    <div class="parse-status error">
      <Alert variant="danger" title="Excel Parsing Error">
        {parseError}
      </Alert>
    </div>
  {:else if file && totalContactCount > 0}
    <div class="parse-status success">
      <Alert variant="success" title="File Parsed Successfully">
        Found <strong>{totalContactCount}</strong> valid contact{totalContactCount === 1 ? '' : 's'} in
        <code>{file.name}</code>. Invalid email addresses were automatically filtered out by the server parser.
      </Alert>
    </div>
  {/if}
</div>

<style>
  .contact-uploader {
    display: grid;
    gap: var(--space-2, 0.5rem);
  }
  .uploader-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .header-titles {
    display: flex;
    flex-direction: column;
  }
  .uploader-title {
    font-weight: 650;
    font-size: 0.875rem;
    color: var(--color-foreground, #1e293b);
  }
  .required {
    color: #ef4444;
  }
  .uploader-hint {
    font-size: 0.75rem;
    color: var(--color-muted, #64748b);
  }
  .sample-download-link {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-primary, #4f46e5);
    text-decoration: underline;
  }
  .parse-status {
    margin-top: 0.25rem;
  }
  .parse-status.loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #475569;
    background: #f1f5f9;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius-md, 0.375rem);
  }
</style>
