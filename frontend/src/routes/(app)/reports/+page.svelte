<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/shared/PageHeader.svelte';
  import Alert from '$lib/components/ui/Alert.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import {
    ReportStatsCards,
    ReportToolbar,
    ReportTable,
    ReportCard
  } from '$lib/components/reports';
  import {
    getReport,
    exportReportCsv,
    exportReportJson,
    clearReportLogs
  } from '$lib/api/report';
  import { downloadBlob } from '$lib/utils/download';
  import {
    filterLogs,
    sortLogs,
    type ReportFilterOptions,
    type ReportSortColumn,
    type ReportStatusFilter,
    type SortDirection
  } from '$lib/utils/reportFilters';
  import {
    isPolling,
    pollStatus,
    startAdaptivePolling,
    stopAdaptivePolling
  } from '$lib/stores/polling';
  import { addToast } from '$lib/stores/toast';
  import type { EmailLog, ReportStats } from '$lib/types/api';

  // Authoritative server state
  let rawLogs: EmailLog[] = [];
  let rawStats: ReportStats = { total: 0, sent: 0, failed: 0, errors: 0 };

  // Page lifecycle & loading states
  let initialLoading = true;
  let refreshing = false;
  let fetchError: string | null = null;

  // Client-side view & filter state
  let searchQuery = '';
  let statusFilter: ReportStatusFilter = 'all';
  let startDate = '';
  let endDate = '';
  let sortKey: ReportSortColumn = 'timestamp';
  let sortDirection: SortDirection = 'descending';

  // Export & mutation states
  let exportingCsv = false;
  let exportingJson = false;
  let clearingLogs = false;
  let isClearModalOpen = false;

  // Derived filtered & sorted logs
  $: filterOpts = {
    searchQuery,
    statusFilter,
    startDate,
    endDate
  } as ReportFilterOptions;

  $: filteredLogs = filterLogs(rawLogs, filterOpts);
  $: sortedLogs = sortLogs(filteredLogs, sortKey, sortDirection);

  $: hasActiveFilters = Boolean(
    searchQuery.trim() !== '' || statusFilter !== 'all' || startDate !== '' || endDate !== ''
  );

  $: isServerEmpty = !initialLoading && !fetchError && rawLogs.length === 0;
  $: isFilteredEmpty = !initialLoading && !fetchError && rawLogs.length > 0 && filteredLogs.length === 0;

  // Active-refresh condition: auto-refresh is active only when polling is active AND jobs are actually running
  $: autoRefreshActive =
    $isPolling && Boolean($pollStatus?.hasActiveBatch || $pollStatus?.hasRunningScheduledJobs);

  /**
   * Fetches report data from GET /report.
   * If isBackground is true, suppresses the full page skeleton.
   */
  async function loadReport(isBackground = false) {
    if (!isBackground) {
      if (rawLogs.length === 0) initialLoading = true;
      else refreshing = true;
    }
    fetchError = null;

    try {
      const res = await getReport();
      if (res.data) {
        rawLogs = res.data.logs || [];
        rawStats = res.data.stats || { total: 0, sent: 0, failed: 0, errors: 0 };
      }
    } catch (err) {
      if (!isBackground) {
        fetchError = err instanceof Error ? err.message : 'Failed to retrieve delivery reports.';
      }
    } finally {
      initialLoading = false;
      refreshing = false;
    }
  }

  onMount(() => {
    if (browser) {
      void loadReport(false);
      // Start adaptive polling listener for active jobs
      startAdaptivePolling(async () => {
        await loadReport(true);
      });
    }
  });

  onDestroy(() => {
    if (browser) {
      stopAdaptivePolling();
    }
  });

  // Action handlers
  async function handleManualRefresh() {
    refreshing = true;
    await loadReport(false);
    addToast('Reports refreshed', 'info');
  }

  function handleSearchChange(query: string) {
    searchQuery = query;
  }

  function handleStatusChange(status: ReportStatusFilter) {
    statusFilter = status;
  }

  function handleStartDateChange(date: string) {
    startDate = date;
  }

  function handleEndDateChange(date: string) {
    endDate = date;
  }

  function handleClearFilters() {
    searchQuery = '';
    statusFilter = 'all';
    startDate = '';
    endDate = '';
  }

  function handleSort(column: ReportSortColumn) {
    if (sortKey === column) {
      sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';
    } else {
      sortKey = column;
      sortDirection = column === 'timestamp' ? 'descending' : 'ascending';
    }
  }

  async function handleExportCsv() {
    if (exportingCsv || rawLogs.length === 0) return;
    exportingCsv = true;
    try {
      const blob = await exportReportCsv();
      downloadBlob(blob, 'email-logs.csv');
      addToast('Report exported as CSV', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export CSV';
      addToast(msg, 'danger');
    } finally {
      exportingCsv = false;
    }
  }

  async function handleExportJson() {
    if (exportingJson || rawLogs.length === 0) return;
    exportingJson = true;
    try {
      const blob = await exportReportJson();
      downloadBlob(blob, 'email-logs.json');
      addToast('Report exported as JSON', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export JSON';
      addToast(msg, 'danger');
    } finally {
      exportingJson = false;
    }
  }

  function handleOpenClearDialog() {
    if (rawLogs.length === 0) return;
    isClearModalOpen = true;
  }

  function handleCloseClearDialog() {
    if (clearingLogs) return;
    isClearModalOpen = false;
  }

  async function handleConfirmClear() {
    clearingLogs = true;
    try {
      const res = await clearReportLogs();
      if (res.success) {
        addToast('All delivery logs cleared successfully', 'success');
        isClearModalOpen = false;
        // Refetch authoritative report from server
        await loadReport(false);
      } else {
        addToast(res.message || 'Failed to clear delivery logs', 'danger');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error clearing delivery logs';
      addToast(msg, 'danger');
    } finally {
      clearingLogs = false;
    }
  }
</script>

<svelte:head>
  <title>Delivery Reports & Analytics | Bulk Email Sender</title>
</svelte:head>

<div class="reports-page">
  <PageHeader
    title="Delivery Reports & Analytics"
    description="Review campaign delivery logs, inspect recipient outcomes, export records, and manage delivery history."
  />

  <!-- 4 Authoritative Stat Cards -->
  <ReportStatsCards stats={rawStats} loading={initialLoading} />

  <!-- Initial Error State with Retry -->
  {#if fetchError && rawLogs.length === 0}
    <div class="error-container">
      <Alert variant="danger" title="Unable to load reports">
        <p>{fetchError}</p>
        <div class="error-retry-action">
          <Button variant="secondary" onClick={() => loadReport(false)}>
            Retry Loading Reports
          </Button>
        </div>
      </Alert>
    </div>
  {:else if isServerEmpty}
    <!-- True Server Empty State -->
    <div class="empty-container">
      <EmptyState
        title="No delivery logs found"
        message="No email campaigns have been recorded yet. Start sending campaigns to generate delivery logs."
      >
        <svelte:fragment slot="action">
          <Button variant="primary" onClick={() => goto('/send')}>
            🚀 Create a Campaign
          </Button>
        </svelte:fragment>
      </EmptyState>
    </div>
  {:else}
    <!-- Interactive Toolbar: Filters, Search, Actions -->
    <ReportToolbar
      {searchQuery}
      {statusFilter}
      {startDate}
      {endDate}
      {hasActiveFilters}
      {refreshing}
      {autoRefreshActive}
      {exportingCsv}
      {exportingJson}
      {clearingLogs}
      totalCount={rawLogs.length}
      filteredCount={filteredLogs.length}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusChange}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      onClearFilters={handleClearFilters}
      onRefresh={handleManualRefresh}
      onExportCsv={handleExportCsv}
      onExportJson={handleExportJson}
      onOpenClearDialog={handleOpenClearDialog}
    />

    <!-- Filtered Empty State -->
    {#if isFilteredEmpty}
      <div class="filtered-empty-card">
        <h3>No matching logs found</h3>
        <p>No delivery logs match your active search or filter criteria.</p>
        <Button variant="secondary" onClick={handleClearFilters}>
          Clear All Filters
        </Button>
      </div>
    {:else}
      <!-- Desktop Table View (>= 768px) -->
      <div class="desktop-view">
        <ReportTable
          logs={sortedLogs}
          {sortKey}
          {sortDirection}
          onSort={handleSort}
        />
      </div>

      <!-- Mobile Cards View (< 768px) -->
      <div class="mobile-view">
        <div class="card-stack">
          {#each sortedLogs as log (log.id || log.timestamp + log.email)}
            <ReportCard {log} />
          {/each}
        </div>
      </div>
    {/if}
  {/if}

  <!-- Irreversible Clear Logs Confirmation Modal -->
  <ConfirmDialog
    open={isClearModalOpen}
    title="Clear All Delivery Logs"
    message="Are you sure you want to clear all email delivery logs? This action is permanent and cannot be undone."
    confirmLabel="Clear All Logs"
    loading={clearingLogs}
    onCancel={handleCloseClearDialog}
    onConfirm={handleConfirmClear}
  />
</div>

<style>
  .reports-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 80rem;
    margin: 0 auto;
  }

  .error-container,
  .empty-container {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--space-6);
  }

  .error-retry-action {
    margin-top: var(--space-3);
  }

  .filtered-empty-card {
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8) var(--space-4);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }
  .filtered-empty-card h3 {
    margin: 0;
    font-size: 1.0625rem;
    color: var(--color-foreground);
  }
  .filtered-empty-card p {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
    max-width: 28rem;
  }

  .desktop-view {
    display: none;
  }
  .mobile-view {
    display: block;
  }

  @media (min-width: 48rem) {
    .desktop-view {
      display: block;
    }
    .mobile-view {
      display: none;
    }
  }

  .card-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
</style>
