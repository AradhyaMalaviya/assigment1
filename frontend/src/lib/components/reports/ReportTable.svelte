<script lang="ts">
  import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import type { EmailLog } from '$lib/types/api';
  import {
    formatReportTimestamp,
    type ReportSortColumn,
    type SortDirection
  } from '$lib/utils/reportFilters';

  export let logs: EmailLog[] = [];
  export let sortKey: ReportSortColumn = 'timestamp';
  export let sortDirection: SortDirection = 'descending';
  export let onSort: (column: ReportSortColumn) => void;

  function getStatusVariant(status: EmailLog['status']): 'success' | 'danger' | 'warning' {
    if (status === 'Sent') return 'success';
    if (status === 'Failed') return 'danger';
    return 'warning';
  }

  function getAriaSort(column: ReportSortColumn): 'ascending' | 'descending' | 'none' {
    if (sortKey !== column) return 'none';
    return sortDirection;
  }
</script>

<div class="report-table-wrapper">
  <table class="report-table">
    <thead>
      <tr>
        <!-- Email -->
        <th scope="col" aria-sort={getAriaSort('email')}>
          <button type="button" class="sort-btn" on:click={() => onSort('email')}>
            <span>Email</span>
            {#if sortKey === 'email'}
              {#if sortDirection === 'ascending'}<ArrowUp size={14} />{:else}<ArrowDown size={14} />{/if}
            {:else}
              <ArrowUpDown size={14} class="text-muted" />
            {/if}
          </button>
        </th>

        <!-- Status -->
        <th scope="col" aria-sort={getAriaSort('status')}>
          <button type="button" class="sort-btn" on:click={() => onSort('status')}>
            <span>Status</span>
            {#if sortKey === 'status'}
              {#if sortDirection === 'ascending'}<ArrowUp size={14} />{:else}<ArrowDown size={14} />{/if}
            {:else}
              <ArrowUpDown size={14} class="text-muted" />
            {/if}
          </button>
        </th>

        <!-- First Name -->
        <th scope="col" aria-sort={getAriaSort('firstName')}>
          <button type="button" class="sort-btn" on:click={() => onSort('firstName')}>
            <span>First Name</span>
            {#if sortKey === 'firstName'}
              {#if sortDirection === 'ascending'}<ArrowUp size={14} />{:else}<ArrowDown size={14} />{/if}
            {:else}
              <ArrowUpDown size={14} class="text-muted" />
            {/if}
          </button>
        </th>

        <!-- Company -->
        <th scope="col" aria-sort={getAriaSort('company')}>
          <button type="button" class="sort-btn" on:click={() => onSort('company')}>
            <span>Company</span>
            {#if sortKey === 'company'}
              {#if sortDirection === 'ascending'}<ArrowUp size={14} />{:else}<ArrowDown size={14} />{/if}
            {:else}
              <ArrowUpDown size={14} class="text-muted" />
            {/if}
          </button>
        </th>

        <!-- Subject -->
        <th scope="col" aria-sort={getAriaSort('subject')}>
          <button type="button" class="sort-btn" on:click={() => onSort('subject')}>
            <span>Subject</span>
            {#if sortKey === 'subject'}
              {#if sortDirection === 'ascending'}<ArrowUp size={14} />{:else}<ArrowDown size={14} />{/if}
            {:else}
              <ArrowUpDown size={14} class="text-muted" />
            {/if}
          </button>
        </th>

        <!-- Timestamp -->
        <th scope="col" aria-sort={getAriaSort('timestamp')}>
          <button type="button" class="sort-btn" on:click={() => onSort('timestamp')}>
            <span>Timestamp</span>
            {#if sortKey === 'timestamp'}
              {#if sortDirection === 'ascending'}<ArrowUp size={14} />{:else}<ArrowDown size={14} />{/if}
            {:else}
              <ArrowUpDown size={14} class="text-muted" />
            {/if}
          </button>
        </th>

        <!-- Message ID -->
        <th scope="col">
          <span class="non-sort-header">Message ID</span>
        </th>

        <!-- Error / Details -->
        <th scope="col">
          <span class="non-sort-header">Error / Details</span>
        </th>
      </tr>
    </thead>

    <tbody>
      {#if logs.length > 0}
        {#each logs as log (log.id || log.timestamp + log.email)}
          <tr>
            <!-- Email -->
            <td class="email-cell font-medium text-foreground">
              <span title={log.email}>{log.email}</span>
            </td>

            <!-- Status -->
            <td class="status-cell">
              <Badge variant={getStatusVariant(log.status)} text={log.status} />
            </td>

            <!-- First Name -->
            <td class="name-cell text-muted">
              {log.firstName || '—'}
            </td>

            <!-- Company -->
            <td class="company-cell text-muted">
              {log.company || '—'}
            </td>

            <!-- Subject -->
            <td class="subject-cell text-foreground">
              <span class="truncate-cell" title={log.subject || ''}>
                {log.subject || '—'}
              </span>
            </td>

            <!-- Timestamp -->
            <td class="time-cell text-muted whitespace-nowrap">
              {formatReportTimestamp(log.timestamp)}
            </td>

            <!-- Message ID -->
            <td class="msgid-cell font-mono text-xs text-muted">
              {#if log.messageId}
                <span class="truncate-msgid" title={log.messageId}>
                  {log.messageId}
                </span>
              {:else}
                —
              {/if}
            </td>

            <!-- Error / Details -->
            <td class="detail-cell text-xs">
              {#if log.message}
                <span
                  class="truncate-detail {log.status !== 'Sent' ? 'text-danger font-medium' : 'text-muted'}"
                  title={log.message}
                >
                  {log.message}
                </span>
              {:else}
                <span class="text-muted">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .report-table-wrapper {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }

  .report-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.875rem;
  }

  th,
  td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  th {
    background: var(--color-background);
    color: var(--color-muted);
    font-weight: 650;
    font-size: 0.8125rem;
    white-space: nowrap;
    user-select: none;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: color-mix(in srgb, var(--color-background) 50%, transparent);
  }

  .sort-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
    font-weight: inherit;
    font-size: inherit;
    cursor: pointer;
    padding: 0;
  }
  .sort-btn:hover {
    color: var(--color-foreground);
  }

  .non-sort-header {
    display: inline-block;
  }

  .email-cell {
    max-width: 14rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .truncate-cell {
    display: inline-block;
    max-width: 12rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .truncate-msgid {
    display: inline-block;
    max-width: 9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .truncate-detail {
    display: inline-block;
    max-width: 14rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .text-foreground {
    color: var(--color-foreground);
  }
  .text-muted {
    color: var(--color-muted);
  }
  .text-danger {
    color: var(--color-danger);
  }
  .font-medium {
    font-weight: 500;
  }
  .whitespace-nowrap {
    white-space: nowrap;
  }
</style>
