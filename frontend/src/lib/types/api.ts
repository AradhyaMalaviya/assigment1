/** Mirrors the public backend contract in src/types.ts. Keep this file in lockstep with it. */
export interface Contact {
  Email: string;
  FirstName?: string;
  LastName?: string;
  Company?: string;
  Subject?: string;
  [key: string]: unknown;
}

export interface EmailLog {
  id: string;
  email: string;
  status: 'Sent' | 'Failed' | 'Error';
  message?: string;
  timestamp: string;
  messageId?: string;
  firstName?: string;
  company?: string;
  subject?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

export interface BatchConfig {
  batchSize: number;
  emailDelay: number;
  batchDelay: number;
  enabled: boolean;
}

export interface BatchJob {
  id: string;
  totalContacts: number;
  currentBatch: number;
  totalBatches: number;
  emailsSent: number;
  emailsFailed: number;
  status: 'Running' | 'Paused' | 'Completed' | 'Failed';
  startTime: string;
  config: BatchConfig;
  emailJob: EmailJob;
  nextBatchTime?: string;
  notificationSettings?: { email: string; userId: string; configName?: string };
  userId?: string;
  configName?: string;
}

export interface EmailJob {
  contacts: Contact[];
  htmlContent: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  config: EmailConfig;
  delay: number;
}
export interface BatchStatus {
  isRunning: boolean;
  currentJob: BatchJob | null;
  totalJobs: number;
  completedJobs: number;
}
export interface ScheduledJob {
  id: string;
  userId: string;
  emailJob: EmailJob;
  batchConfig?: BatchConfig;
  scheduledTime: string;
  notifyEmail?: string;
  notifyBrowser?: boolean;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  contactCount: number;
  subject: string;
  useBatch: boolean;
  configName?: string;
}
export interface ProviderLimits {
  dailyLimit: number;
  name: string;
  recommendedBatchSize: number;
  recommendedDelay: number;
}
export interface User {
  id: string;
  email: string;
  name: string;
}
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface SmtpConfig {
  id?: string;
  name?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  fromEmail: string;
  fromName: string;
  isDefault?: boolean;
  createdAt?: string;
}
export interface SmtpConfigListResponse extends ApiResponse<SmtpConfig | null> {
  hasConfig: boolean;
  hasEnvConfig: boolean;
  currentMode: 'user' | 'env';
  envConfig: SmtpConfig | null;
  userConfigs: SmtpConfig[];
  userId: string;
  userName: string;
}
export interface ActiveSmtpConfigResponse extends ApiResponse<SmtpConfig | null> {
  mode: 'user' | 'env';
  configId?: string;
  configName?: string;
}
export interface ParseExcelResponse {
  success: boolean;
  contacts: Contact[];
  totalCount: number;
  message?: string;
}
export interface ProviderInfo {
  provider: string;
  dailyLimit: number;
  maxContacts: number;
  recommendedBatchSize: number;
  recommendedDelay: number;
}
export interface ProviderInfoResponse extends ApiResponse<never> {
  provider: string;
  dailyLimit: number;
  maxContacts: number;
  recommendedBatchSize: number;
  recommendedDelay: number;
}
export type SendResponse =
  | {
      success: true;
      message: string;
      jobId: string;
      scheduledTime: string;
      contactCount: number;
      scheduledMode: true;
      batchMode: boolean;
      configUsed: string;
    }
  | {
      success: true;
      message: string;
      jobId: string;
      contactCount: number;
      batchMode: true;
      batchConfig: BatchConfig;
      configUsed: string;
    }
  | { success: true; message: string; contactCount: number; configUsed: string };
export interface PollStatus {
  pollNeeded: boolean;
  pollInterval: number;
  hasActiveBatch: boolean;
  hasScheduledJobs: boolean;
  hasRunningScheduledJobs: boolean;
  activeBatchCount: 0 | 1;
  scheduledJobCount: 0 | 1;
  lastUpdated: string;
  cached: boolean;
  error?: string;
}
export type PollStatusResponse = ApiResponse<PollStatus>;

export interface DashboardData {
  batch: BatchStatus | null;
  scheduledJobs: ScheduledJob[];
  timestamp: string;
}
export type DashboardDataResponse = ApiResponse<DashboardData>;
