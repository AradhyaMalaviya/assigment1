<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import type { Contact } from '$lib/types/api';
  import { replacePlaceholders } from '$lib/utils/placeholders';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  export let open: boolean = false;
  export let subject: string = '';
  export let htmlContent: string = '';
  export let templatePreviewHtml: string | null = null;
  export let hasTemplate: boolean = false;
  export let previewContact: Contact | null = null;
  export let selectedConfigName: string = '';

  const fallbackContact: Contact = {
    Email: 'sample.recipient@example.com',
    FirstName: 'Jane',
    LastName: 'Doe',
    Company: 'Acme Corp',
    Subject: 'Sample Subject'
  };

  $: activeContact = previewContact || fallbackContact;
  $: rawBody = (hasTemplate && templatePreviewHtml) ? templatePreviewHtml : htmlContent;
  $: renderedSubject = replacePlaceholders(subject || '(No Subject Provided)', activeContact);
  $: renderedBody = replacePlaceholders(rawBody || '<p><em>(No Content Provided)</em></p>', activeContact);
  $: contentSourceLabel = (hasTemplate && templatePreviewHtml) ? 'Uploaded HTML Template File' : 'Rich Text Editor Content';

  function handleClose() {
    dispatch('close');
  }
</script>

<Modal {open} title="📧 Campaign Preview" on:close={handleClose}>
  <div class="preview-modal-body">
    <!-- Meta Bar -->
    <div class="preview-meta-bar">
      <div class="meta-item">
        <span class="meta-label">Content Source:</span>
        <span class="meta-badge" class:template-badge={hasTemplate}>{contentSourceLabel}</span>
      </div>
      {#if selectedConfigName}
        <div class="meta-item">
          <span class="meta-label">Sender Config:</span>
          <span class="meta-val">{selectedConfigName}</span>
        </div>
      {/if}
    </div>

    <!-- Contact Applied Box -->
    <div class="contact-info-box">
      <span class="box-title">Applied Contact Data ({previewContact ? 'First Parsed Contact' : 'Generic Sample Data'}):</span>
      <div class="contact-key-values">
        <span class="kv-pair"><strong>Email:</strong> {activeContact.Email}</span>
        {#if activeContact.FirstName}
          <span class="kv-pair"><strong>FirstName:</strong> {activeContact.FirstName}</span>
        {/if}
        {#if activeContact.LastName}
          <span class="kv-pair"><strong>LastName:</strong> {activeContact.LastName}</span>
        {/if}
        {#if activeContact.Company}
          <span class="kv-pair"><strong>Company:</strong> {activeContact.Company}</span>
        {/if}
      </div>
    </div>

    <!-- Subject Preview -->
    <div class="subject-preview-card">
      <span class="card-label">Subject:</span>
      <span class="rendered-subject-text">{renderedSubject}</span>
    </div>

    <!-- Rendered Email Body Preview -->
    <div class="body-preview-card">
      <span class="card-label">Rendered Email Body:</span>
      <div class="html-preview-frame">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html renderedBody}
      </div>
    </div>
  </div>
</Modal>

<style>
  .preview-modal-body {
    display: grid;
    gap: 0.875rem;
    max-height: 70vh;
    overflow-y: auto;
  }
  .preview-meta-bar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    background: #f8fafc;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md, 0.375rem);
    font-size: 0.8125rem;
  }
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .meta-label {
    color: #64748b;
    font-weight: 500;
  }
  .meta-badge {
    background: #e0e7ff;
    color: #3730a3;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }
  .meta-badge.template-badge {
    background: #e0f2fe;
    color: #0369a1;
  }
  .meta-val {
    font-weight: 600;
    color: #1e293b;
  }
  .contact-info-box {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    display: grid;
    gap: 0.25rem;
  }
  .box-title {
    font-weight: 650;
    color: #334155;
  }
  .contact-key-values {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    color: #475569;
  }
  .subject-preview-card {
    border: 1px solid #cbd5e1;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.625rem 0.75rem;
    background: #ffffff;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .card-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
  }
  .rendered-subject-text {
    font-size: 0.9375rem;
    font-weight: 650;
    color: #0f172a;
  }
  .body-preview-card {
    display: grid;
    gap: 0.375rem;
  }
  .html-preview-frame {
    border: 1px solid #cbd5e1;
    border-radius: var(--radius-md, 0.375rem);
    padding: 1rem;
    background: #ffffff;
    min-height: 12rem;
    max-height: 20rem;
    overflow-y: auto;
    line-height: 1.5;
    color: #1e293b;
    font-size: 0.875rem;
  }
  :global(.html-preview-frame img) {
    max-width: 100%;
    height: auto;
  }
</style>
