let counter = 0;

/**
 * Per-instance element id fallback for UI primitives.
 *
 * Primitives accept an explicit `id` prop, but their default must not be a shared
 * constant: two instances on one page would emit duplicate ids and every
 * `label[for]` / `aria-describedby` would resolve to the first instance only.
 * The label and its control derive from the same call, so the association stays
 * correct even though the value differs between the SSR and hydrated renders.
 */
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
