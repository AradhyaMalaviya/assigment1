<script lang="ts">
  import Badge from '$lib/components/ui/Badge.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { ScheduledJob } from '$lib/types/api';

  export let jobs: ScheduledJob[] = [];
  export let cancellingId: string | null = null;
  export let onCancel: (job: ScheduledJob) => void;

  function formatLocalDateTime(isoString?: string): string {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
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
</script>

<div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 shadow-sm">
  <table class="w-full text-left text-sm text-slate-700 dark:text-slate-200 divide-y divide-slate-200 dark:divide-slate-700/80">
    <thead class="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
      <tr>
        <th scope="col" class="py-3.5 px-4">Campaign / Subject</th>
        <th scope="col" class="py-3.5 px-4">Scheduled Launch (Local)</th>
        <th scope="col" class="py-3.5 px-4">Contacts</th>
        <th scope="col" class="py-3.5 px-4">Delivery Mode</th>
        <th scope="col" class="py-3.5 px-4">SMTP Config</th>
        <th scope="col" class="py-3.5 px-4">Notification</th>
        <th scope="col" class="py-3.5 px-4">Status</th>
        <th scope="col" class="py-3.5 px-4 text-right">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
      {#each jobs as job (job.id)}
        {@const isRunning = job.status === 'running'}
        {@const subject = job.subject || job.emailJob?.subject || 'Bulk Email Campaign'}
        {@const scheduledTimeStr = job.scheduledTime || job.scheduled_time || ''}
        {@const contactCount = job.contactCount ?? job.contact_count ?? job.emailJob?.contacts?.length ?? 0}
        {@const isBatch = Boolean(job.useBatch ?? job.use_batch ?? job.batchConfig?.enabled)}
        {@const configName = job.configName || job.config_name || 'Default Config'}
        {@const notifyEmail = job.notifyEmail || job.notify_email || ''}

        <tr class="hover:bg-slate-50/75 dark:hover:bg-slate-700/30 transition-colors">
          <!-- Campaign / Subject -->
          <td class="py-3.5 px-4 max-w-[220px]">
            <div class="font-bold text-slate-900 dark:text-white truncate" title={subject}>
              {subject}
            </div>
            <div class="text-xs text-slate-400 font-mono truncate" title={job.id}>
              ID: {job.id}
            </div>
          </td>

          <!-- Scheduled Launch Time -->
          <td class="py-3.5 px-4 whitespace-nowrap">
            <span class="font-semibold text-slate-900 dark:text-white">
              {formatLocalDateTime(scheduledTimeStr)}
            </span>
          </td>

          <!-- Contacts Count -->
          <td class="py-3.5 px-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              {contactCount} contacts
            </span>
          </td>

          <!-- Delivery Mode -->
          <td class="py-3.5 px-4 whitespace-nowrap">
            {#if isBatch}
              <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                ⚡ Batch
              </span>
            {:else}
              <span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Sequential
              </span>
            {/if}
          </td>

          <!-- Config Name -->
          <td class="py-3.5 px-4 max-w-[160px]">
            <span class="truncate block text-slate-600 dark:text-slate-300 text-xs" title={configName}>
              {configName}
            </span>
          </td>

          <!-- Notification Alert -->
          <td class="py-3.5 px-4 max-w-[160px]">
            {#if notifyEmail}
              <span class="text-xs text-blue-600 dark:text-blue-400 truncate flex items-center gap-1" title="Notification recipient">
                🔔 {notifyEmail}
              </span>
            {:else}
              <span class="text-xs text-slate-400 italic">None</span>
            {/if}
          </td>

          <!-- Status Badge -->
          <td class="py-3.5 px-4 whitespace-nowrap">
            <Badge
              variant={isRunning ? 'info' : 'warning'}
              text={isRunning ? '● Running' : '🕒 Scheduled'}
            />
          </td>

          <!-- Actions -->
          <td class="py-3.5 px-4 whitespace-nowrap text-right">
            {#if isRunning}
              <Button
                variant="danger"
                disabled={true}
                ariaLabel="Cannot cancel a job that is currently executing"
              >
                Cancel
              </Button>
            {:else}
              <Button
                variant="danger"
                loading={cancellingId === job.id}
                disabled={cancellingId === job.id}
                onClick={() => onCancel(job)}
              >
                Cancel
              </Button>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
