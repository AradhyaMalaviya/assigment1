import type { Contact } from '$lib/types/api';

export function replacePlaceholders(template: string, contact: Contact): string {
  return template.replace(/{{([^}]+)}}/g, (_, key: string) => String(contact[key.trim()] ?? ''));
}
