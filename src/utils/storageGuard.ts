const DEFAULT_MAX_BYTES = 7 * 1024 * 1024;

export function estimateBytes(value: unknown): number {
  try { return new Blob([JSON.stringify(value)]).size; } catch { return 0; }
}

export function canPersist(value: unknown, maxBytes = DEFAULT_MAX_BYTES): boolean {
  return estimateBytes(value) <= maxBytes;
}

export function persistSafely(key: string, value: unknown, maxBytes = DEFAULT_MAX_BYTES): boolean {
  try {
    if (!canPersist(value, maxBytes)) {
      console.warn(`Dados de ${key} excedem o limite seguro de armazenamento.`);
      return false;
    }
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Falha ao persistir ${key}.`, error);
    return false;
  }
}

export function removeOversizedMediaDataUrl(url: string, maxBytes = 2 * 1024 * 1024): string {
  return estimateBytes(url) <= maxBytes ? url : "";
}
