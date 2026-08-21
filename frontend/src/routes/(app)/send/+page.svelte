<script lang="ts">
  import { onMount } from 'svelte';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
  import { listConfigs } from '$lib/api/config';
  import { parseExcel, getProviderInfo, sendEmails } from '$lib/api/email';
  import type { SmtpConfig, Contact, ProviderInfo, SendResponse } from '$lib/types/api';
  import type { RecipientRangeInput } from '$lib/types/forms';
  import { computeRecipientRange } from '$lib/utils/range';
  import { isValidEmail } from '$lib/utils/validation';
  import { buildSendFormData } from '$lib/utils/sendForm';
  import { addActivity } from '$lib/stores/activity';
  import { addToast } from '$lib/stores/toast';
  import {
    ConfigSelector,
    ContactUploader,
    ContactPreviewTable,
    EmailRangeSelector,
    SubjectField,
    TemplateUploader,
    ProviderLimitPanel,
    EmailPreviewModal,
    BatchSettings,
    ScheduleSettings,
    SendSuccessModal
  } from '$lib/components/email';

  // Page state - Configs
  let configs: SmtpConfig[] = [];
  let loadingConfigs: boolean = true;
  let configError: string | null = null;
  let selectedConfigId: string = '';

  // Page state - Contacts & Range
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

  // Page state - Content
  let subject: string = '';
  let delay: number = 20;
  let htmlContent: string = '';
  let htmlTemplateFile: File | null = null;
  let templatePreviewHtml: string | null = null;

  // Page state - Batch Settings
  let useBatch: boolean = false;
  let batchSize: number = 20;
  let batchDelay: number = 60;
  let emailDelay: number = 45;

  // Page state - Schedule & Notification Settings
  let scheduleEmail: boolean = false;
  let scheduledTime: string = '';
  let notifyEmail: string = '';
  let notifyBrowser: boolean = false;

  // Page state - Provider Limits
  let providerInfo: ProviderInfo | null = null;
  let loadingProvider: boolean = false;
  let providerError: string | null = null;

  // Page state - Modals & Sending
  let previewOpen: boolean = false;
  let isSending: boolean = false;
  let sendError: string | null = null;
  let sendResult: SendResponse | null = null;
  let successModalOpen: boolean = false;

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
  $: isBatchValid = !useBatch || (
    Number.isInteger(batchSize) && batchSize >= 1 &&
    Number.isInteger(batchDelay) && batchDelay >= 1 &&
    Number.isInteger(emailDelay) && emailDelay >= 1
  );
  $: isScheduleValid = !scheduleEmail || (
    !!scheduledTime && new Date(scheduledTime).getTime() > Date.now()
  );
  $: isNotifyEmailValid = !notifyEmail || isValidEmail(notifyEmail.trim());
  $: isProviderCapValid = !providerInfo || computedRange.count <= providerInfo.maxContacts;

  $: isCompositionReady = !!selectedConfigId &&
    totalContactCount > 0 &&
    computedRange.isValid &&
    isSubjectValid &&
    isDelayValid &&
    hasValidContent &&
    isBatchValid &&
    isScheduleValid &&
    isNotifyEmailValid &&
    isProviderCapValid;

  $: sendButtonLabel = scheduleEmail
    ? '📅 Schedule Campaign'
    : useBatch
    ? '⚡ Send Campaign (Batch Mode)'
    : '🚀 Send Campaign Immediately';

  onMount(async () => {
    try {
      loadingConfigs = true;
      const res = await listConfigs();
      configs = res.userConfigs || [];
      if (configs.length > 0) {
        const defaultConfig = configs.find((c) => c.isDefault) || configs[0];
        selectedConfigId = defaultConfig.id || '';
        fetchProviderForConfig(defaultConfig, !!notifyEmail);
      }
    } catch (err: unknown) {
      configError = (err as Error)?.message || 'Failed to load SMTP configurations.';
    } finally {
      loadingConfigs = false;
    }
  });

  async function fetchProviderForConfig(config: SmtpConfig | null, hasNotification: boolean) {
    if (!config || !config.host) {
      providerInfo = null;
      return;
    }
    try {
      loadingProvider = true;
      providerError = null;
      const res = await getProviderInfo(config.host, hasNotification);
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
    fetchProviderForConfig(event.detail.config, !!notifyEmail);
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

  function handleBatchChange(event: CustomEvent<{
    useBatch: boolean;
    batchSize: number;
    batchDelay: number;
    emailDelay: number;
  }>) {
    useBatch = event.detail.useBatch;
    batchSize = event.detail.batchSize;
    batchDelay = event.detail.batchDelay;
    emailDelay = event.detail.emailDelay;
  }

  function handleScheduleChange(event: CustomEvent<{
    scheduleEmail: boolean;
    scheduledTime: string;
    notifyEmail: string;
    notifyBrowser: boolean;
  }>) {
    const prevNotify = notifyEmail;
    scheduleEmail = event.detail.scheduleEmail;
    scheduledTime = event.detail.scheduledTime;
    notifyEmail = event.detail.notifyEmail;
    notifyBrowser = event.detail.notifyBrowser;

    // If notification email presence changed, refresh provider limits
    if (!!prevNotify !== !!notifyEmail && selectedConfig) {
      fetchProviderForConfig(selectedConfig, !!notifyEmail);
    }
  }

  function openPreview() {
    previewOpen = true;
  }

  function closePreview() {
    previewOpen = false;
  }

  async function handleSendCampaign() {
    sendError = null;

    if (!isCompositionReady) {
      sendError = 'Please complete all required campaign parameters before dispatching.';
      return;
    }

    if (!excelFile) {
      sendError = 'Please select a valid Excel contacts file.';
      return;
    }

    try {
      isSending = true;

      const payload = {
        configId: selectedConfigId,
        subject,
        htmlContent,
        delay,
        useBatch,
        batchSize,
        batchDelay,
        emailDelay,
        scheduleEmail,
        scheduledTimeLocal: scheduledTime,
        notifyEmail,
        notifyBrowser,
        rangeStart: computedRange.start,
        rangeCount: computedRange.count,
        excelFile,
        htmlTemplateFile
      };

      const formData = buildSendFormData(payload);
      const res = await sendEmails(formData);
      sendResult = res;
      successModalOpen = true;

      // Record activity in the activity timeline
      if (res && 'scheduledMode' in res && res.scheduledMode === true) {
        addActivity(
          'scheduled',
          `Scheduled "${subject}" for ${res.contactCount} contact${res.contactCount === 1 ? '' : 's'} at ${new Date(res.scheduledTime).toLocaleString()}`
        );
        addToast(`Campaign scheduled successfully for ${new Date(res.scheduledTime).toLocaleTimeString()}!`, 'success', 'Campaign Scheduled');
      } else if (res && 'batchMode' in res && res.batchMode === true) {
        addActivity(
          'started',
          `Started batch campaign "${subject}" for ${res.contactCount} contacts`
        );
        addToast(`Batch campaign started for ${res.contactCount} contacts!`, 'success', 'Batch Started');
      } else {
        addActivity(
          'started',
          `Started bulk sending "${subject}" to ${res.contactCount} contacts`
        );
        addToast(`Campaign dispatched to ${res.contactCount} contacts!`, 'success', 'Sending Started');
      }
    } catch (err: unknown) {
      sendError = (err as Error)?.message || 'Failed to dispatch campaign. Please verify SMTP credentials and settings.';
    } finally {
      isSending = false;
    }
  }

  function handleComposeAnother() {
    successModalOpen = false;
    sendResult = null;
    subject = '';
    htmlContent = '';
    htmlTemplateFile = null;
    templatePreviewHtml = null;
    excelFile = null;
    parsedContacts = [];
    totalContactCount = 0;
  }
</script>

<svelte:head>
  <title>Campaign Composer | Bulk Email Sender</title>
</svelte:head>

<PageHeader
  title="Campaign Composer"
  description="Select an SMTP server, upload contact spreadsheets, filter recipient ranges, compose rich email content, configure batch or scheduled delivery, and launch campaigns."
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

    <!-- Step 4: Subject Line & Direct Delay -->
    <Card>
      <h2 slot="header" class="card-section-title">4. Subject Line & Base Timing</h2>
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

    <!-- Step 6: Batch Delivery Controls -->
    <Card>
      <h2 slot="header" class="card-section-title">6. Batch Delivery Engine</h2>
      <BatchSettings
        {useBatch}
        {batchSize}
        {batchDelay}
        {emailDelay}
        recipientCount={computedRange.count}
        on:change={handleBatchChange}
      />
    </Card>

    <!-- Step 7: Scheduled Delivery & Notifications -->
    <Card>
      <h2 slot="header" class="card-section-title">7. Schedule Delivery & Completion Alerts</h2>
      <ScheduleSettings
        {scheduleEmail}
        {scheduledTime}
        {notifyEmail}
        {notifyBrowser}
        on:change={handleScheduleChange}
      />
    </Card>

    <!-- Step 8: Provider Limits & Delivery Compliance -->
    <Card>
      <h2 slot="header" class="card-section-title">8. SMTP Provider Delivery Compliance</h2>
      <ProviderLimitPanel
        {providerInfo}
        {loadingProvider}
        {providerError}
        recipientCount={computedRange.count}
      />
    </Card>

    <!-- Step 9: Launch & Readiness -->
    <Card>
      <h2 slot="header" class="card-section-title">9. Campaign Readiness & Launch</h2>
      <div class="readiness-section">
        <div class="readiness-actions">
          <Button
            type="button"
            variant="secondary"
            on:click={openPreview}
            disabled={!hasValidContent && !isSubjectValid}
          >
            🔍 Preview Personalized Output
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={!isCompositionReady || isSending}
            loading={isSending}
            on:click={handleSendCampaign}
          >
            {isSending ? 'Verifying SMTP & Starting Campaign...' : sendButtonLabel}
          </Button>
        </div>

        {#if sendError}
          <Alert variant="danger" title="Campaign Delivery Error">
            <div class="send-error-content">
              <p>{sendError}</p>
              <small>If this is an SMTP error, please check credentials or app-password setup under SMTP Configurations.</small>
            </div>
          </Alert>
        {/if}

        {#if isCompositionReady}
          <Alert variant="success" title="Campaign Validated & Ready for Dispatch">
            <div class="ready-summary">
              <p>All delivery parameters are validated and ready:</p>
              <ul>
                <li><strong>SMTP Gateway:</strong> {selectedConfig?.name} ({selectedConfig?.host}:{selectedConfig?.port})</li>
                <li><strong>Target Recipients:</strong> {computedRange.count} contact{computedRange.count === 1 ? '' : 's'} (Workbook rows: {computedRange.start + 1} to {computedRange.end})</li>
                <li><strong>Message Source:</strong> {htmlTemplateFile ? `Uploaded Template (${htmlTemplateFile.name})` : 'Rich Text Editor HTML'}</li>
                <li><strong>Subject:</strong> <code>{subject}</code></li>
                <li><strong>Delivery Pipeline:</strong> {scheduleEmail ? `Scheduled for ${new Date(scheduledTime).toLocaleString()}` : useBatch ? `Batch Mode (${batchSize} emails every ${batchDelay}m)` : `Direct Sequential (${delay}s delay)`}</li>
                {#if notifyEmail}
                  <li><strong>Completion Alert:</strong> Summary will be emailed to <code>{notifyEmail}</code></li>
                {/if}
              </ul>
              <p class="smtp-verify-notice">
                ℹ️ <strong>SMTP Verification:</strong> When you click dispatch, the server validates the live SMTP connection before launching to ensure deliverability.
              </p>
            </div>
          </Alert>
        {:else}
          <div class="unready-box">
            <span class="unready-title">⚠️ Composition Checklist — Please resolve the following required steps:</span>
            <ul class="unready-list">
              {#if !selectedConfigId}
                <li>Select a saved SMTP Configuration in Step 1.</li>
              {/if}
              {#if totalContactCount <= 0}
                <li>Upload and parse a valid Excel workbook (.xlsx) with an Email column in Step 2.</li>
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
                <li>Provide message content in the Rich Text Editor or upload an HTML template in Step 5.</li>
              {/if}
              {#if !isBatchValid}
                <li>Provide valid positive integer values for batch size, batch delay, and email delay in Step 6.</li>
              {/if}
              {#if !isScheduleValid}
                <li>Choose a future date and time for scheduled delivery in Step 7.</li>
              {/if}
              {#if !isNotifyEmailValid}
                <li>Enter a valid notification email address format in Step 7.</li>
              {/if}
              {#if !isProviderCapValid}
                <li>Selected recipient count ({computedRange.count}) exceeds provider limit ({providerInfo?.maxContacts}). Reduce recipient range in Step 3.</li>
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

<!-- Success Modal -->
<SendSuccessModal
  open={successModalOpen}
  response={sendResult}
  configName={selectedConfig?.name || ''}
  {notifyBrowser}
  on:close={() => (successModalOpen = false)}
  on:composeAnother={handleComposeAnother}
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
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
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
  .smtp-verify-notice {
    background: #e0f2fe;
    color: #0369a1;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    margin-top: 0.375rem !important;
  }
  .send-error-content {
    display: grid;
    gap: 0.375rem;
    font-size: 0.875rem;
  }
  .send-error-content p {
    margin: 0;
    font-weight: 600;
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
