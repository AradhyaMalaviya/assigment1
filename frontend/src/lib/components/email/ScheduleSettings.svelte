<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { testNotification } from '$lib/api/email';
  import { addToast } from '$lib/stores/toast';
  import { isValidEmail } from '$lib/utils/validation';

  export let scheduleEmail: boolean = false;
  export let scheduledTime: string = '';
  export let notifyEmail: string = '';
  export let notifyBrowser: boolean = false;
  export let disabled: boolean = false;

  const dispatch = createEventDispatcher<{
    change: {
      scheduleEmail: boolean;
      scheduledTime: string;
      notifyEmail: string;
      notifyBrowser: boolean;
    };
  }>();

  let userTimezone: string = 'UTC';
  let minDateTime: string = '';
  let testingNotification: boolean = false;
  let testError: string | null = null;

  $: isScheduledTimeInFuture = !scheduleEmail || !scheduledTime || (new Date(scheduledTime).getTime() > Date.now());
  $: isNotifyEmailValid = !notifyEmail || isValidEmail(notifyEmail.trim());

  onMount(() => {
    if (browser) {
      try {
        userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      } catch {
        userTimezone = 'UTC';
      }

      updateMinDateTime();

      // If scheduledTime is empty, initialize to 1 hour in the future
      if (!scheduledTime) {
        const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
        const localIso = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        scheduledTime = localIso;
        notifyChange();
      }
    }
  });

  function updateMinDateTime() {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    minDateTime = localNow.toISOString().slice(0, 16);
  }

  function notifyChange() {
    dispatch('change', {
      scheduleEmail,
      scheduledTime,
      notifyEmail,
      notifyBrowser
    });
  }

  function handleScheduleToggle() {
    if (scheduleEmail && !scheduledTime) {
      const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
      const localIso = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      scheduledTime = localIso;
    }
    notifyChange();
  }

  function handleTimeInput(e: Event) {
    scheduledTime = (e.target as HTMLInputElement).value;
    notifyChange();
  }

  function handleNotifyEmailInput(e: Event) {
    notifyEmail = (e.target as HTMLInputElement).value;
    testError = null;
    notifyChange();
  }

  async function handleBrowserNotifyToggle() {
    if (notifyBrowser && browser && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            addToast('Desktop notifications were not granted in browser settings.', 'warning', 'Permission Notice');
          }
        } catch (e) {
          console.error('Error requesting notification permission:', e);
        }
      }
    }
    notifyChange();
  }

  async function handleTestNotification() {
    if (!notifyEmail || !notifyEmail.trim()) {
      testError = 'Please enter an email address before sending a test notification.';
      return;
    }
    if (!isValidEmail(notifyEmail.trim())) {
      testError = 'Please enter a valid email address.';
      return;
    }

    try {
      testingNotification = true;
      testError = null;
      const res = await testNotification(notifyEmail.trim());
      if (res.success) {
        addToast(res.message || 'Test notification sent! Check your inbox.', 'success', 'Notification Sent');
      } else {
        testError = res.message || 'Failed to send test notification.';
      }
    } catch (err: unknown) {
      testError = (err as Error)?.message || 'Error occurred while sending test notification.';
    } finally {
      testingNotification = false;
    }
  }
</script>

<div class="schedule-settings-container">
  <!-- Schedule Toggle -->
  <div class="toggle-row">
    <Checkbox
      id="schedule-email-toggle"
      label="Schedule Campaign for Future Delivery"
      hint="Queues the campaign in the background scheduler to dispatch automatically at your chosen local date and time."
      bind:checked={scheduleEmail}
      {disabled}
      on:change={handleScheduleToggle}
    />
  </div>

  {#if scheduleEmail}
    <div class="schedule-panel">
      <div class="schedule-input-row">
        <div class="time-field">
          <label for="scheduled-time-input">
            Scheduled Launch Date & Time <span class="req">*</span>
          </label>
          <input
            id="scheduled-time-input"
            type="datetime-local"
            min={minDateTime}
            value={scheduledTime}
            {disabled}
            on:input={handleTimeInput}
            class:invalid={!isScheduledTimeInFuture}
          />
          <p class="timezone-notice">
            Detected Timezone: <strong>{userTimezone}</strong> (Automatically converted to UTC ISO format for delivery).
          </p>
          {#if !isScheduledTimeInFuture}
            <p class="field-error" role="alert">⚠️ Scheduled time must be in the future.</p>
          {/if}
        </div>
      </div>

      <div class="scheduler-note">
        <p>
          ℹ️ <strong>Scheduler cadence:</strong> The backend scheduler service polls for due jobs once every 60 seconds.
          Jobs execute within approximately 60 seconds of their target time.
        </p>
      </div>
    </div>
  {/if}

  <!-- Notification Settings -->
  <div class="notifications-panel">
    <h3 class="panel-subtitle">Campaign Completion Notifications (Optional)</h3>
    <div class="notify-grid">
      <div class="notify-email-field">
        <label for="notify-email-input">Notification Recipient Email</label>
        <div class="email-input-with-button">
          <input
            id="notify-email-input"
            type="email"
            placeholder="e.g. notifications@yourdomain.com"
            value={notifyEmail}
            {disabled}
            on:input={handleNotifyEmailInput}
            class:invalid={!isNotifyEmailValid}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || !notifyEmail || !isNotifyEmailValid || testingNotification}
            loading={testingNotification}
            on:click={handleTestNotification}
          >
            📨 Test Alert
          </Button>
        </div>
        <p class="field-hint">
          Receive an automated performance summary and completion report when this campaign finishes sending.
        </p>
        {#if !isNotifyEmailValid}
          <p class="field-error" role="alert">Please enter a valid email format.</p>
        {/if}
        {#if testError}
          <p class="field-error" role="alert">{testError}</p>
        {/if}
      </div>

      <div class="notify-browser-field">
        <Checkbox
          id="notify-browser-toggle"
          label="Enable Desktop Browser Notifications"
          hint="Triggers an instant OS/browser notification banner when your campaign is scheduled or completes delivery."
          bind:checked={notifyBrowser}
          {disabled}
          on:change={handleBrowserNotifyToggle}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .schedule-settings-container {
    display: grid;
    gap: 1.25rem;
  }
  .toggle-row {
    padding-bottom: 0.25rem;
  }
  .schedule-panel {
    display: grid;
    gap: 1rem;
    background: #fdfbf7;
    border: 1px solid #fed7aa;
    border-radius: var(--radius-md, 0.375rem);
    padding: 1rem;
  }
  .time-field {
    display: grid;
    gap: 0.375rem;
    max-width: 420px;
  }
  label {
    font-size: 0.8125rem;
    font-weight: 650;
    color: var(--color-foreground, #0f172a);
  }
  .req {
    color: var(--color-danger, #dc2626);
  }
  input[type='datetime-local'],
  input[type='email'] {
    width: 100%;
    border: 1px solid var(--color-border, #cbd5e1);
    border-radius: var(--radius-md, 0.375rem);
    background: #ffffff;
    color: var(--color-foreground, #0f172a);
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  input:focus {
    outline: none;
    border-color: var(--color-primary, #667eea);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
  }
  input.invalid {
    border-color: var(--color-danger, #dc2626);
  }
  input:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
  .timezone-notice {
    margin: 0;
    font-size: 0.75rem;
    color: #9a3412;
  }
  .field-hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-muted, #64748b);
  }
  .field-error {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-danger, #dc2626);
    font-weight: 500;
  }
  .scheduler-note {
    font-size: 0.8125rem;
    color: #7c2d12;
    background: #fff7ed;
    padding: 0.625rem 0.875rem;
    border-radius: 0.25rem;
  }
  .scheduler-note p {
    margin: 0;
  }
  .notifications-panel {
    display: grid;
    gap: 0.75rem;
    background: #f8fafc;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: var(--radius-md, 0.375rem);
    padding: 1rem;
  }
  .panel-subtitle {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 650;
    color: var(--color-foreground, #0f172a);
  }
  .notify-grid {
    display: grid;
    gap: 1rem;
  }
  .email-input-with-button {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .notify-email-field {
    display: grid;
    gap: 0.375rem;
  }
  .notify-browser-field {
    padding-top: 0.25rem;
  }
</style>
