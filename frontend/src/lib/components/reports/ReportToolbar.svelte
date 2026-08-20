<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Search, RotateCw, Download, FileJson, Trash2, X } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import type { ReportStatusFilter } from '$lib/utils/reportFilters';

  export let searchQuery = '';
  export let statusFilter: ReportStatusFilter = 'all';
  export let startDate = '';
  export let endDate = '';
  export let hasActiveFilters = false;
  export let refreshing = false;
  export let autoRefreshActive = false;
  export let exportingCsv = false;
  export let exportingJson = false;
  export let clearingLogs = false;
  export let totalCount = 0;
  export let filteredCount = 0;

  export let onSearchChange: (query: string) => void;
  export let onStatusChange: (status: ReportStatusFilter) => void;
  export let onStartDateChange: (date: string) => void;
  export let onEndDateChange: (date: string) => void;
  export let onClearFilters: () => void;
  export let onRefresh: () => void;
  export let onExportCsv: () => void;
  export let onExportJson: () => void;
  export let onOpenClearDialog: () => void;

  let localSearch = searchQuery;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  $: if (searchQuery !== localSearch && debounceTimer === null) {
    localSearch = searchQuery;
  }

  function handleSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    localSearch = val;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onSearchChange(localSearch);
      debounceTimer = null;
    }, 250);
  }

  function handleClearSearch() {
    localSearch = '';
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
    onSearchChange('');
  }

  onDestroy(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  });
</script>

<div class="toolbar-container">
  <!-- Top action row: exports, refresh, auto-refresh badge, clear logs -->
  <div class="action-bar">
    <div class="status-summary">
      <h2 class="section-title">Delivery Logs</h2>
      <span class="count-pill">
        {#if hasActiveFilters}
          Showing {filteredCount} of {totalCount}
        {:else}
          {totalCount} total
        {/if}
      </span>
      {#if autoRefreshActive}
        <span class="auto-refresh-badge" title="Auto-refreshing while campaigns are executing">
          <RotateCw size={13} class="spin-icon" />
          <span>Auto-refresh ON</span>
        </span>
      {/if}
    </div>

    <div class="action-buttons">
      <Button
        variant="secondary"
        onClick={onRefresh}
        disabled={refreshing}
        loading={refreshing}
        ariaLabel="Refresh delivery logs"
      >
        <RotateCw size={15} />
        <span>Refresh</span>
      </Button>

      <Button
        variant="secondary"
        onClick={onExportCsv}
        disabled={exportingCsv || totalCount === 0}
        loading={exportingCsv}
        ariaLabel="Export delivery logs as CSV"
      >
        <Download size={15} />
        <span>Export CSV</span>
      </Button>

      <Button
        variant="secondary"
        onClick={onExportJson}
        disabled={exportingJson || totalCount === 0}
        loading={exportingJson}
        ariaLabel="Export delivery logs as JSON"
      >
        <FileJson size={15} />
        <span>Export JSON</span>
      </Button>

      <Button
        variant="danger"
        onClick={onOpenClearDialog}
        disabled={clearingLogs || totalCount === 0}
        loading={clearingLogs}
        ariaLabel="Clear all delivery logs"
      >
        <Trash2 size={15} />
        <span>Clear Logs</span>
      </Button>
    </div>
  </div>

  <!-- Filters row: Search, Status, Date range, Reset -->
  <div class="filters-bar">
    <!-- Search input -->
    <div class="filter-group search-group">
      <label for="report-search-input" class="filter-label">Search Logs</label>
      <div class="search-input-wrap">
        <Search size={16} class="search-icon" />
        <input
          id="report-search-input"
          type="text"
          class="search-input"
          placeholder="Search by email, name, subject, message ID..."
          value={localSearch}
          on:input={handleSearchInput}
        />
        {#if localSearch}
          <button
            type="button"
            class="clear-search-btn"
            aria-label="Clear search text"
            on:click={handleClearSearch}
          >
            <X size={14} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Status filter -->
    <div class="filter-group status-group">
      <label for="report-status-select" class="filter-label">Status</label>
      <select
        id="report-status-select"
        class="filter-select"
        value={statusFilter}
        on:change={(e) => onStatusChange(e.currentTarget.value as ReportStatusFilter)}
      >
        <option value="all">All Statuses</option>
        <option value="Sent">Sent</option>
        <option value="Failed">Failed</option>
        <option value="Error">Error</option>
      </select>
    </div>

    <!-- Date range: Start Date -->
    <div class="filter-group date-group">
      <label for="report-start-date" class="filter-label">From Date</label>
      <input
        id="report-start-date"
        type="date"
        class="filter-date-input"
        value={startDate}
        on:change={(e) => onStartDateChange(e.currentTarget.value)}
      />
    </div>

    <!-- Date range: End Date -->
    <div class="filter-group date-group">
      <label for="report-end-date" class="filter-label">To Date</label>
      <input
        id="report-end-date"
        type="date"
        class="filter-date-input"
        value={endDate}
        on:change={(e) => onEndDateChange(e.currentTarget.value)}
      />
    </div>

    <!-- Clear Filters Button -->
    {#if hasActiveFilters}
      <div class="filter-group reset-group">
        <button
          type="button"
          class="reset-filters-btn"
          on:click={onClearFilters}
          aria-label="Reset all search and filter criteria"
        >
          <X size={14} />
          <span>Reset Filters</span>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .toolbar-container {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    margin-bottom: var(--space-5);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .action-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--color-border);
  }

  .status-summary {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .section-title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-foreground);
  }
  .count-pill {
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.15rem var(--space-2);
    border-radius: 999px;
    background: var(--color-background);
    color: var(--color-muted);
    border: 1px solid var(--color-border);
  }

  .auto-refresh-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-info);
    background: color-mix(in srgb, var(--color-info) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-info) 25%, transparent);
    border-radius: 999px;
    padding: 0.15rem var(--space-2);
  }
  :global(.spin-icon) {
    animation: spin 3s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .filters-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-3);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .search-group {
    flex: 1 1 14rem;
    min-width: 12rem;
  }
  .status-group {
    flex: 0 1 9rem;
    min-width: 8rem;
  }
  .date-group {
    flex: 0 1 9.5rem;
    min-width: 8.5rem;
  }
  .reset-group {
    align-self: flex-end;
    padding-bottom: 2px;
  }

  .filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .search-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  :global(.search-icon) {
    position: absolute;
    left: 0.75rem;
    color: var(--color-muted);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 2.25rem;
    font-size: 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-background);
    color: var(--color-foreground);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .search-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
  }
  .clear-search-btn {
    position: absolute;
    right: 0.5rem;
    display: grid;
    place-items: center;
    background: transparent;
    border: none;
    color: var(--color-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
  }
  .clear-search-btn:hover {
    color: var(--color-foreground);
  }

  .filter-select,
  .filter-date-input {
    height: 2.375rem;
    padding: 0 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-background);
    color: var(--color-foreground);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .filter-select:focus,
  .filter-date-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
  }

  .reset-filters-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    height: 2.375rem;
    padding: 0 var(--space-3);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-muted);
    background: transparent;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .reset-filters-btn:hover {
    color: var(--color-foreground);
    border-color: var(--color-foreground);
    background: var(--color-background);
  }
</style>
