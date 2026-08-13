const isGmailHost = (host: string) => host.toLowerCase().includes('gmail');

/** Strips whitespace from Gmail App Passwords (Google displays them with spaces); trims everything else. */
export function processSmtpPassword(password: string, host: string): string {
  const trimmed = password.trim();
  return isGmailHost(host) ? trimmed.replace(/\s+/g, '') : trimmed;
}

/** Returns a user-facing message, or null when the password is fine (or the host isn't Gmail). */
export function validateGmailPassword(password: string, host: string): string | null {
  if (!isGmailHost(host)) return null;
  const clean = password.replace(/\s+/g, '');
  if (clean.length !== 16)
    return `Gmail App Password should be 16 characters. Current length: ${clean.length}. Make sure you're using an App Password, not your regular Gmail password.`;
  if (!/^[a-zA-Z0-9]+$/.test(clean))
    return 'Gmail App Password should only contain letters and numbers. Special characters are not allowed.';
  return null;
}

export interface ProviderGuidance {
  title: string;
  tone: 'info' | 'warning';
  steps: string[];
  helpUrl?: string;
}

/** Contextual setup guidance keyed off the host the user has typed so far. */
export function getProviderGuidance(host: string, mode: 'create' | 'edit'): ProviderGuidance | null {
  const normalized = host.trim().toLowerCase();
  if (!normalized) return null;
  if (isGmailHost(normalized)) {
    return {
      title: 'Gmail setup',
      tone: mode === 'edit' ? 'warning' : 'info',
      helpUrl: 'https://myaccount.google.com/apppasswords',
      steps:
        mode === 'edit'
          ? [
              'Leave the password blank to keep the current one.',
              'Enter a 16-character App Password to change it.',
              "Spaces are fine — they're removed automatically.",
            ]
          : [
              'Enable 2-Factor Authentication on the Google account.',
              'Generate an App Password (Google Account → Security → App passwords).',
              'Use the 16-character App Password, not the regular Gmail password.',
              "Spaces are fine — they're removed automatically.",
            ],
    };
  }
  if (normalized.includes('outlook') || normalized.includes('hotmail'))
    return { title: 'Outlook setup', tone: 'info', steps: ['Use the regular Outlook password. No App Password is needed.'] };
  if (normalized.includes('yahoo'))
    return { title: 'Yahoo setup', tone: 'info', steps: ['Yahoo Mail may require an App Password rather than the account password.'] };
  return null;
}
