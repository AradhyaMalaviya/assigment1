import type { EmailLog } from '$lib/types/api';

export type ReportStatusFilter = 'all' | 'Sent' | 'Failed' | 'Error';
export type ReportSortColumn =
  | 'email'
  | 'status'
  | 'firstName'
  | 'company'
  | 'subject'
  | 'timestamp'
  | 'messageId'
  | 'message';
export type SortDirection = 'ascending' | 'descending';

export interface ReportFilterOptions {
  searchQuery?: string;
  statusFilter?: ReportStatusFilter;
  startDate?: string; // YYYY-MM-DD (local)
  endDate?: string; // YYYY-MM-DD (local)
}

/**
 * Filters a list of email logs client-side by search query, status, and date range.
 * Does not mutate the source array.
 */
export function filterLogs(logs: EmailLog[], options: ReportFilterOptions): EmailLog[] {
  const query = (options.searchQuery || '').trim().toLowerCase();
  const status = options.statusFilter || 'all';
  const startDate = options.startDate?.trim();
  const endDate = options.endDate?.trim();

  let startMs: number | null = null;
  if (startDate) {
    const parsed = new Date(`${startDate}T00:00:00`).getTime();
    if (!isNaN(parsed)) startMs = parsed;
  }

  let endMs: number | null = null;
  if (endDate) {
    const parsed = new Date(`${endDate}T23:59:59.999`).getTime();
    if (!isNaN(parsed)) endMs = parsed;
  }

  return logs.filter((log) => {
    // 1. Status filter
    if (status !== 'all' && log.status !== status) {
      return false;
    }

    // 2. Date range filter
    if (startMs !== null || endMs !== null) {
      const logTime = new Date(log.timestamp).getTime();
      if (isNaN(logTime)) {
        return false;
      }
      if (startMs !== null && logTime < startMs) return false;
      if (endMs !== null && logTime > endMs) return false;
    }

    // 3. Search query
    if (query) {
      const email = (log.email || '').toLowerCase();
      const firstName = (log.firstName || '').toLowerCase();
      const company = (log.company || '').toLowerCase();
      const subject = (log.subject || '').toLowerCase();
      const messageId = (log.messageId || '').toLowerCase();
      const message = (log.message || '').toLowerCase();
      const id = (log.id || '').toLowerCase();

      const matches =
        email.includes(query) ||
        firstName.includes(query) ||
        company.includes(query) ||
        subject.includes(query) ||
        messageId.includes(query) ||
        message.includes(query) ||
        id.includes(query);

      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Sorts a list of email logs client-side by a chosen column and direction.
 * Does not mutate the input array.
 */
export function sortLogs(
  logs: EmailLog[],
  sortKey: ReportSortColumn,
  direction: SortDirection,
): EmailLog[] {
  return [...logs].sort((a, b) => {
    let comparison: number;

    if (sortKey === 'timestamp') {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      comparison = timeA - timeB;
    } else if (sortKey === 'status') {
      const statusOrder: Record<string, number> = { Sent: 1, Failed: 2, Error: 3 };
      const rankA = statusOrder[a.status] || 99;
      const rankB = statusOrder[b.status] || 99;
      comparison = rankA - rankB;
      if (comparison === 0) {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
    } else {
      const valA = (a[sortKey] || '').toString();
      const valB = (b[sortKey] || '').toString();
      comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true });
    }

    return direction === 'ascending' ? comparison : -comparison;
  });
}

/**
 * Formats an ISO or date string for display in the user's local timezone.
 */
export function formatReportTimestamp(timestamp: string): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return timestamp;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
