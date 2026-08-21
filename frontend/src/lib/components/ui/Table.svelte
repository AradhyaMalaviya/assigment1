<script context="module" lang="ts">
  export type TableCell = string | number | boolean | null | undefined;
  export type TableRow = Record<string, TableCell>;
  export type TableColumn = { key: string; label: string; sortable?: boolean };
</script>

<script lang="ts">
  import { ArrowDownUp } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    sort: { key: string; direction: 'ascending' | 'descending' };
  }>();
  export let columns: TableColumn[] = [];
  export let rows: TableRow[] = [];
  export let emptyMessage = 'No data available.';
  let sortKey = '';
  let direction: 'ascending' | 'descending' = 'ascending';

  function sort(column: TableColumn) {
    if (!column.sortable) return;
    direction = sortKey === column.key && direction === 'ascending' ? 'descending' : 'ascending';
    sortKey = column.key;
    dispatch('sort', { key: sortKey, direction });
  }
</script>

<div class="table-wrap">
  <table>
    <thead
      ><tr
        >{#each columns as column (column.key)}<th
            scope="col"
            aria-sort={sortKey === column.key ? direction : 'none'}
            >{#if column.sortable}<button type="button" on:click={() => sort(column)}
                >{column.label}<ArrowDownUp size={14} /></button
              >{:else}{column.label}{/if}</th
          >{/each}</tr
      ></thead
    >
    <tbody
      >{#if rows.length}{#each rows as row (JSON.stringify(row))}<tr
            >{#each columns as column (column.key)}<td data-label={column.label}
                >{row[column.key] ?? '—'}</td
              >{/each}</tr
          >{/each}{:else}<tr><td class="empty" colspan={columns.length}>{emptyMessage}</td></tr
        >{/if}</tbody
    >
  </table>
</div>

<style>
  .table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  th,
  td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    font-size: 0.875rem;
  }
  th {
    color: var(--color-muted);
    background: var(--color-background);
    font-weight: 650;
    white-space: nowrap;
  }
  th button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: inherit;
    cursor: pointer;
  }
  tr:last-child td {
    border-bottom: 0;
  }
  .empty {
    color: var(--color-muted);
    text-align: center;
  }
  @media (max-width: 47.99rem) {
    .table-wrap {
      overflow: visible;
      border: 0;
    }
    table,
    tbody,
    tr,
    td {
      display: block;
      width: 100%;
    }
    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
    tr {
      margin-bottom: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }
    td {
      display: grid;
      grid-template-columns: minmax(7rem, 40%) 1fr;
      gap: var(--space-3);
      border-bottom: 1px solid var(--color-border);
    }
    td::before {
      content: attr(data-label);
      color: var(--color-muted);
      font-weight: 650;
    }
    td.empty {
      display: block;
      text-align: center;
    }
    td.empty::before {
      content: none;
    }
  }
</style>
