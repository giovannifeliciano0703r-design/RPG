export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 80;

export const normalizeDisplayName = (value: string) => value.trim().replace(/\s+/g, " ");

export const getDisplayNameError = (value: string): string | null => {
  const normalized = normalizeDisplayName(value);
  if (normalized.length < DISPLAY_NAME_MIN_LENGTH) {
    return `Use pelo menos ${DISPLAY_NAME_MIN_LENGTH} caracteres no nome de exibição.`;
  }
  if (normalized.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Use no máximo ${DISPLAY_NAME_MAX_LENGTH} caracteres no nome de exibição.`;
  }
  return null;
};
