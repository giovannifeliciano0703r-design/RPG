/** Ignore both results and errors after the requesting account scope expires. */
export async function settleInScope<T>(
  operation: () => Promise<T>,
  isCurrent: () => boolean,
  apply: (value: T) => void,
  reportError: (error: unknown) => void,
): Promise<void> {
  if (!isCurrent()) return;
  try {
    const value = await operation();
    if (isCurrent()) apply(value);
  } catch (error) {
    if (isCurrent()) reportError(error);
  }
}
