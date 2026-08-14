export interface SendCampaignPayload {
  configId: string;
  subject: string;
  htmlContent: string;
  delay: number;
  useBatch: boolean;
  batchSize: number;
  batchDelay: number;
  emailDelay: number;
  scheduleEmail: boolean;
  scheduledTimeLocal: string;
  notifyEmail?: string;
  notifyBrowser: boolean;
  rangeStart: number;
  rangeCount: number;
  excelFile: File;
  htmlTemplateFile?: File | null;
}

/**
 * Builds the exact 16-field multipart/form-data payload required by POST /send.
 * Ensures booleans are formatted as literal "on" / "off", numeric values are serialized,
 * local datetime is converted to UTC ISO format, and files are attached.
 */
export function buildSendFormData(payload: SendCampaignPayload): FormData {
  const formData = new FormData();

  // 1. SMTP Config ID
  formData.append('configId', payload.configId);

  // 2. Subject (trimmed)
  formData.append('subject', payload.subject.trim());

  // 3. Message HTML Content
  formData.append('htmlContent', payload.htmlContent);

  // 4. Delay between emails (non-batch mode)
  formData.append('delay', String(payload.delay || 20));

  // 5. Batch processing flag ("on" | "off")
  formData.append('useBatch', payload.useBatch ? 'on' : 'off');

  // 6. Batch size
  formData.append('batchSize', String(payload.batchSize || 20));

  // 7. Batch delay (minutes)
  formData.append('batchDelay', String(payload.batchDelay || 60));

  // 8. Email delay in batch mode (seconds)
  formData.append('emailDelay', String(payload.emailDelay || 45));

  // 9. Schedule email flag ("on" | "off")
  formData.append('scheduleEmail', payload.scheduleEmail ? 'on' : 'off');

  // 10. Scheduled time in UTC ISO string
  if (payload.scheduleEmail && payload.scheduledTimeLocal) {
    const userLocalDate = new Date(payload.scheduledTimeLocal);
    formData.append('scheduledTime', userLocalDate.toISOString());
  } else {
    formData.append('scheduledTime', '');
  }

  // 11. Notification email
  if (payload.notifyEmail && payload.notifyEmail.trim()) {
    formData.append('notifyEmail', payload.notifyEmail.trim());
  } else {
    formData.append('notifyEmail', '');
  }

  // 12. Browser notification flag ("on" | "off")
  formData.append('notifyBrowser', payload.notifyBrowser ? 'on' : 'off');

  // 13. Email range start (0-based index)
  formData.append('emailRangeStart', String(payload.rangeStart));

  // 14. Email range count
  formData.append('emailRangeCount', String(payload.rangeCount));

  // 15. Excel file (.xlsx)
  formData.append('excelFile', payload.excelFile);

  // 16. Optional HTML template file (.html / .htm)
  if (payload.htmlTemplateFile && payload.htmlTemplateFile.size > 0) {
    formData.append('htmlTemplate', payload.htmlTemplateFile);
  }

  return formData;
}
