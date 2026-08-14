<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { ScheduledJob } from '$lib/types/api';

  export let job: ScheduledJob;
  export let cancelling: boolean = false;
  export let onCancel: (job: ScheduledJob) => void;

  function formatLocalDateTime(isoString?: string): string {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  $: subject = job.subject || job.emailJob?.subject || 'Bulk Email Campaign';
  $: scheduledTimeStr = job.scheduledTime || job.scheduled_time || '';
  $: contactCount = job.contactCount ?? job.contact_count ?? job.emailJob?.contacts?.length ?? 0;
  $: isBatch = Boolean(job.useBatch ?? job.use_batch ?? job.batchConfig?.enabled);
  $: configName = job.configName || job.config_name || 'Default Configuration';
  $: notifyEmail = job.notifyEmail || job.notify_email || '';
  $: isRunning = job.status === 'running';
</script>

<div
  class="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700/80 shadow-sm transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-600 flex flex-col gap-4"
  class:border-amber-300={isRunning}
  class:dark:border-amber-700={isRunning}
>
  <div class="flex items-start justify-between gap-3">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap mb-1">
        <h3 class="text-base font-bold text-slate-900 dark:text-white truncate">
          {subject}
        </h3>
        <Badge
          variant={isRunning ? 'info' : 'warning'}
          text={isRunning ? '● Running' : '🕒 Scheduled'}
        />
        {#if isBatch}
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ⚡ Batch Mode
          </span>
        {:else}
          <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            Sequential
          </span>
        {/if}
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">
        ID: {job.id}
      </p>
    </div>

    <div class="shrink-0">
      {#if isRunning}
        <div class="relative group inline-block">
          <Button
            variant="danger"
            disabled={true}
            ariaLabel="Cannot cancel a job that is currently executing"
          >
            Cancel
          </Button>
          <span class="sr-only">Running jobs cannot be cancelled</span>
        </div>
      {:else}
        <Button
          variant="danger"
          loading={cancelling}
          disabled={cancelling}
          onClick={() => onCancel(job)}
        >
          Cancel Job
        </Button>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
    <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span class="text-slate-400 font-medium w-24 shrink-0">Scheduled Time:</span>
      <span class="font-semibold text-slate-900 dark:text-white">
        {formatLocalDateTime(scheduledTimeStr)}
      </span>
    </div>

    <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span class="text-slate-400 font-medium w-24 shrink-0">Recipients:</span>
      <span class="font-semibold text-slate-900 dark:text-white">
        {contactCount} {contactCount === 1 ? 'contact' : 'contacts'}
      </span>
    </div>

    <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span class="text-slate-400 font-medium w-24 shrink-0">SMTP Config:</span>
      <span class="truncate text-slate-700 dark:text-slate-200" title={configName}>
        {configName}
      </span>
    </div>

    <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
      <span class="text-slate-400 font-medium w-24 shrink-0">Notification:</span>
      {#if notifyEmail}
        <span class="text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
          🔔 {notifyEmail}
        </span>
      {:else}
        <span class="text-slate-400 italic">None configured</span>
      {/if}
    </div>
  </div>

  {#if isRunning}
    <div class="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center gap-2">
      <span>●</span>
      <span>This campaign is currently being dispatched by the scheduler. Cancellation is locked to protect in-flight delivery.</span>
    </div>
  {/if}
</div>
