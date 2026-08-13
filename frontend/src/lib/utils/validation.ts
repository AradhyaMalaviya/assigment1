import type { LoginForm, RegisterForm } from '$lib/types/forms';

/** The exact regex the backend applies in src/routes/auth.ts. Keep the two in lockstep. */
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const MIN_PASSWORD_LENGTH = 6;
export const isValidPassword = (value: string) => value.length >= MIN_PASSWORD_LENGTH;

/**
 * Client-side mirrors of the backend's own validation, so an input the server would
 * reject never costs a round trip. Each returns one aggregate message (or null when
 * valid) because the backend also answers with a single message, never per-field errors.
 *
 * The asymmetry below is deliberate and must be preserved: POST /auth/register checks
 * presence, password length, and email format, while POST /auth/login checks presence
 * only. Applying register's stricter rules to login would reject credentials the server
 * would have accepted.
 */
export function validateLoginForm(form: LoginForm): string | null {
  if (!form.email || !form.password) return 'Email and password are required';
  return null;
}

export function validateRegisterForm(form: RegisterForm): string | null {
  if (!form.email || !form.name || !form.password) return 'Email, name, and password are required';
  if (!isValidPassword(form.password))
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  if (!isValidEmail(form.email)) return 'Invalid email format';
  return null;
}

/**
 * Mirrors POST /config/smtp's own required-field check exactly (config.ts:91-106):
 * presence only on host/user/fromEmail/pass — the backend has no format validation on
 * any of these, so this function must not add one either (an email-format check on
 * fromEmail would reject values the server would accept — the same asymmetry mistake
 * the Phase 4 plan called out for login vs register).
 */
export function validateSmtpConfigForm(
  form: { host: string; user: string; fromEmail: string; pass: string },
  opts: { requirePassword: boolean },
): string | null {
  if (!form.host || !form.user || !form.fromEmail || (opts.requirePassword && !form.pass.trim()))
    return 'Host, username, from email, and password are all required.';
  return null;
}
