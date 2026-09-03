/** Keep the normal debounce, then progressively back off after failed writes. */
export function getSyncRetryDelay(consecutiveFailures: number): number {
  const failures = Number.isFinite(consecutiveFailures)
    ? Math.max(0, Math.min(6, Math.floor(consecutiveFailures)))
    : 6;
  return Math.min(30_000, 900 * 2 ** failures);
}
