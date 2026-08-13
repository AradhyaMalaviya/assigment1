export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

export interface SmtpConfigForm {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  fromEmail: string;
  fromName: string;
  isDefault?: boolean;
}

export interface SmtpTestPayload {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export type RangeMode = 'all' | 'first' | 'custom';

export interface RecipientRangeInput {
  mode: RangeMode;
  firstCount?: number;
  rangeStart?: number; // 1-based user input row
  rangeEnd?: number;   // 1-based user input row
}

export interface ComputedRecipientRange {
  start: number; // 0-based API start index
  count: number; // positive contact count for API
  end: number;   // 1-based user display end row
  isValid: boolean;
  errorMessage?: string;
}
