<script lang="ts">
  import { onMount } from 'svelte';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
  import { listConfigs } from '$lib/api/config';
  import { parseExcel, getProviderInfo } from '$lib/api/email';
  import type { SmtpConfig, Contact, ProviderInfo } from '$lib/types/api';
  import type { RecipientRangeInput } from '$lib/types/forms';
  import { computeRecipientRange } from '$lib/utils/range';
  import {
    ConfigSelector,
    ContactUploader,
    ContactPreviewTable,
    EmailRangeSelector,
    SubjectField,
    TemplateUploader,
    ProviderLimitPanel,
    EmailPreviewModal
  } from '$lib/components/email';

  // Page state
  let configs: SmtpConfig[] = [];
  let loadingConfigs: boolean = true;
  let configError: string | null = null;
  let selectedConfigId: string = '';

  let excelFile: File | null = null;
  let parsedContacts: Contact[] = [];
  let totalContactCount: number = 0;
  let loadingParse: boolean = false;
  let parseError: string | null = null;

  let rangeInput: RecipientRangeInput = {
    mode: 'all',
    firstCount: 5,
    rangeStart: 1,
    rangeEnd: 5
  };

  let subject: string = '';
  let delay: number = 20;
  let htmlContent: string = '';

  let htmlTemplateFile: File | null = null;
  let templatePreviewHtml: string | null = null;

  let providerInfo: ProviderInfo | null = null;
  let loadingProvider: boolean = false;
  let providerError: string | null = null;

  let previewOpen: boolean = false;

  // Derived state
  $: selectedConfig = configs.find((c) => c.id === selectedConfigId) || null;
  $: computedRange = computeRecipientRange(rangeInput, totalContactCount);

  // Normalize empty editor HTML
  $: isEditorContentEmpty = !htmlContent ||
    htmlContent.trim() === '' ||
    htmlContent.trim() === '<p></p>' ||
    htmlContent.trim() === '<p><br></p>';

  $: hasValidContent = !!htmlTemplateFile || !isEditorContentEmpty;
  $: isSubjectValid = subject.trim().length > 0;
  $: isDelayValid = Number.isInteger(delay) && delay >= 1;
  $: isProviderCapValid = !providerInfo || computedRange.count <= providerInfo.maxContacts;

  $: isCompositionReady = !!selectedConfigId &&
    totalContactCount > 0 &&
    computedRange.isValid &&
    isSubjectValid &&
    isDelayValid &&
    hasValidContent &&
    isProviderCapValid;

  onMount(async () => {
    try {
      loadingConfigs = true;
      const res = await listConfigs();
      configs = res.userConfigs || [];
      if (configs.length > 0) {
        const defaultConfig = configs.find((c) => c.isDefault) || configs[0];
        selectedConfigId = defaultConfig.id || '';
        fetchProviderForConfig(defaultConfig);
      }
    } catch (err: unknown) {
      configError = (err as Error)?.message || 'Failed to load SMTP configurations.';
    } finally {
      loadingConfigs = false;
    }
  });

  async function fetchProviderForConfig(config: SmtpConfig | null) {
    if (!config || !config.host) {
      providerInfo = null;
      return;
    }
    try {
      loadingProvider = true;
      providerError = null;
      const res = await getProviderInfo(config.host, false);
      providerInfo = {
        provider: res.provider,
        dailyLimit: res.dailyLimit,
        maxContacts: res.maxContacts,
        recommendedBatchSize: res.recommendedBatchSize,
        recommendedDelay: res.recommendedDelay
      };
    } catch (err: unknown) {
      providerError = (err as Error)?.message || 'Failed to fetch provider limits for selected configuration.';
      providerInfo = null;
    } finally {
      loadingProvider = false;
    }
  }

  function handleConfigSelect(event: CustomEvent<{ configId: string; config: SmtpConfig | null }>) {
    selectedConfigId = event.detail.configId;
    fetchProviderForConfig(event.detail.config);
  }

  async function handleFileSelect(event: CustomEvent<File | null>) {
    const file = event.detail;
    excelFile = file;
    parsedContacts = [];
    totalContactCount = 0;
    parseError = null;

    if (!file) return;

    try {
      loadingParse = true;
      const res = await parseExcel(file);
      parsedContacts = res.contacts || [];
      totalContactCount = res.totalCount || 0;
      rangeInput = {
        mode: 'all',
        firstCount: Math.min(5, totalContactCount),
        rangeStart: 1,
        rangeEnd: Math.min(5, totalContactCount)
      };
    } catch (err: unknown) {
      parseError = (err as Error)?.message || 'Failed to parse Excel file. Please check file formatting.';
      parsedContacts = [];
      totalContactCount = 0;
    } finally {
      loadingParse = false;
    }
  }

  function handleRangeChange(event: CustomEvent<RecipientRangeInput>) {
    rangeInput = event.detail;
  }

  function handleSubjectChange(event: CustomEvent<string>) {
    subject = event.detail;
  }

  function handleDelayChange(event: CustomEvent<number>) {
    delay = event.detail;
  }

  function handleEditorChange(event: CustomEvent<string>) {
    htmlContent = event.detail;
  }

  function handleTemplateSelect(event: CustomEvent<File | null>) {
    htmlTemplateFile = event.detail;
  }

  function handleTemplateRead(event: CustomEvent<string | null>) {
    templatePreviewHtml = event.detail;
  }

  function openPreview() {
    previewOpen = true;
  }

  function closePreview() {
    previewOpen = false;
  }
</script>

<PageHeader
  title="Campaign Composer"
  description="Select an SMTP server, upload contact spreadsheets, filter recipient ranges, compose rich email content, and verify provider delivery rules."
/>

{#if loadingConfigs}
  <div class="loading-container">
    <Spinner size="md" />
    <span>Loading campaign configuration environment...</span>
  </div>
{:else if configError}
  <Alert variant="danger" title="Configuration Error">{configError}</Alert>
{:else}
  <div class="composer-layout">
    <!-- Step 1: Sender SMTP Configuration -->
    <Card>
      <h2 slot="header" class="card-section-title">1. Sender SMTP Configuration</h2>
      <ConfigSelector
        {configs}
        {selectedConfigId}
        on:select={handleConfigSelect}
      />
    </Card>

    <!-- Step 2: Recipient Contacts Excel File -->
    <Card>
      <h2 slot="header" class="card-section-title">2. Recipient Contacts Upload & Preview</h2>
      <div class="step-content">
        <ContactUploader
          file={excelFile}
          {loadingParse}
          {parseError}
          {totalContactCount}
          on:fileSelect={handleFileSelect}
        />
        <ContactPreviewTable
          contacts={parsedContacts}
          {totalContactCount}
        />
      </div>
    </Card>

    <!-- Step 3: Recipient Range Selection -->
    <Card>
      <h2 slot="header" class="card-section-title">3. Recipient Range Selector</h2>
      <EmailRangeSelector
        {totalContactCount}
        input={rangeInput}
        on:change={handleRangeChange}
      />
    </Card>

    <!-- Step 4: Subject Line & Delay -->
    <Card>
      <h2 slot="header" class="card-section-title">4. Subject Line & Sending Settings</h2>
      <SubjectField
        {subject}
        {delay}
        on:subjectChange={handleSubjectChange}
        on:delayChange={handleDelayChange}
      />
    </Card>

    <!-- Step 5: Email Message Content -->
    <Card>
      <h2 slot="header" class="card-section-title">5. Rich Email Content Composition</h2>
      <div class="step-content">
        <RichTextEditor
          value={htmlContent}
          label="HTML Message Body"
          disabled={!!htmlTemplateFile}
          on:change={handleEditorChange}
        />
        <TemplateUploader
          templateFile={htmlTemplateFile}
          on:templateSelect={handleTemplateSelect}
          on:templateRead={handleTemplateRead}
        />
      </div>
    </Card>

    <!-- Step 6: Provider Limits & Guidance -->
    <Card>
      <h2 slot="header" class="card-section-title">6. SMTP Provider Delivery Limits</h2>
      <ProviderLimitPanel
        {providerInfo}
        {loadingProvider}
        {providerError}
        recipientCount={computedRange.count}
      />
    </Card>

    <!-- Step 7: Composition Readiness & Preview -->
    <Card>
      <h2 slot="header" class="card-section-title">7. Campaign Composition Readiness</h2>
      <div class="readiness-section">
        <div class="readiness-actions">
          <Button
            variant="secondary"
            on:click={openPreview}
            disabled={!hasValidContent && !isSubjectValid}
          >
            🔍 Preview Personalized Email
          </Button>
        </div>

        {#if isCompositionReady}
          <Alert variant="success" title="Composition Ready for Delivery (Phase 7)">
            <div class="ready-summary">
              <p>All campaign composition parameters are valid and ready:</p>
              <ul>
                <li><strong>SMTP Server:</strong> {selectedConfig?.name} ({selectedConfig?.host})</li>
                <li><strong>Recipients:</strong> {computedRange.count} contact{computedRange.count === 1 ? '' : 's'} (Row range: {computedRange.start + 1} to {computedRange.end})</li>
                <li><strong>Content Source:</strong> {htmlTemplateFile ? `Uploaded Template (${htmlTemplateFile.name})` : 'Rich Text Editor HTML'}</li>
                <li><strong>Subject Line:</strong> <code>{subject}</code></li>
                <li><strong>Sending Delay:</strong> {delay} seconds per email</li>
              </ul>
              <p class="phase7-notice">
                ℹ️ <strong>Phase 6 Complete:</strong> Full campaign workspace, Excel parser integration, recipient range arithmetic, editor/template precedence, and provider limit checks are active. Campaign delivery options (immediate, batch, schedule, notifications) will be enabled in Phase 7.
              </p>
            </div>
          </Alert>
        {:else}
          <div class="unready-box">
            <span class="unready-title">⚠️ Composition Incomplete — Please resolve the following steps:</span>
            <ul class="unready-list">
              {#if !selectedConfigId}
                <li>Select a saved SMTP Configuration in Step 1.</li>
              {/if}
              {#if totalContactCount <= 0}
                <li>Upload and parse a valid Excel workbook (.xlsx) containing an Email column in Step 2.</li>
              {/if}
              {#if !computedRange.isValid}
                <li>Correct the Recipient Range selection in Step 3 ({computedRange.errorMessage}).</li>
              {/if}
              {#if !isSubjectValid}
                <li>Enter a campaign Subject line in Step 4.</li>
              {/if}
              {#if !isDelayValid}
                <li>Enter a positive integer sending delay in Step 4.</li>
              {/if}
              {#if !hasValidContent}
                <li>Provide message content in the Rich Text Editor or upload an HTML template file in Step 5.</li>
              {/if}
              {#if !isProviderCapValid}
                <li>Reduce recipient range count; selected count ({computedRange.count}) exceeds provider cap ({providerInfo?.maxContacts}).</li>
              {/if}
            </ul>
          </div>
        {/if}
      </div>
    </Card>
  </div>
{/if}

<!-- Preview Modal -->
<EmailPreviewModal
  open={previewOpen}
  {subject}
  {htmlContent}
  {templatePreviewHtml}
  hasTemplate={!!htmlTemplateFile}
  previewContact={parsedContacts.length > 0 ? parsedContacts[0] : null}
  selectedConfigName={selectedConfig?.name || ''}
  on:close={closePreview}
/>

<style>
  .loading-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem;
    color: #475569;
    font-size: 0.9375rem;
  }
  .card-section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  .composer-layout {
    display: grid;
    gap: 1.25rem;
  }
  .step-content {
    display: grid;
    gap: 1rem;
  }
  .readiness-section {
    display: grid;
    gap: 1rem;
  }
  .readiness-actions {
    display: flex;
    justify-content: flex-start;
  }
  .ready-summary {
    display: grid;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  .ready-summary p {
    margin: 0;
  }
  .ready-summary ul {
    margin: 0.25rem 0;
    padding-left: 1.25rem;
    display: grid;
    gap: 0.25rem;
  }
  .phase7-notice {
    background: #e0f2fe;
    color: #0369a1;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    margin-top: 0.375rem !important;
  }
  .unready-box {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: var(--radius-md, 0.375rem);
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    display: grid;
    gap: 0.5rem;
  }
  .unready-title {
    font-weight: 650;
    color: #334155;
  }
  .unready-list {
    margin: 0;
    padding-left: 1.25rem;
    color: #dc2626;
    display: grid;
    gap: 0.25rem;
  }
</style>
