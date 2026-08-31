const DEFAULT_MAX_ITEM_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_TOTAL_BYTES = 4.5 * 1024 * 1024;

export function estimateBytes(value: unknown): number {
  try {
    return new TextEncoder().encode(typeof value === "string" ? value : JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function canPersist(value: unknown, maxBytes = DEFAULT_MAX_ITEM_BYTES): boolean {
  return estimateBytes(value) <= maxBytes;
}

export function getLocalStorageUsageBytes(): number {
  let total = 0;
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) total += estimateBytes(key) + estimateBytes(localStorage.getItem(key) ?? "");
    }
  } catch {
    return Number.POSITIVE_INFINITY;
  }
  return total;
}

export function persistTextSafely(
  key: string,
  serialized: string,
  maxItemBytes = DEFAULT_MAX_ITEM_BYTES,
  maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES,
): boolean {
  try {
    if (!canPersist(serialized, maxItemBytes)) {
      console.warn(`Dados de ${key} excedem o limite seguro de armazenamento.`);
      return false;
    }
    const previousSize = estimateBytes(localStorage.getItem(key) ?? "");
    const projectedTotal = getLocalStorageUsageBytes() - previousSize + estimateBytes(serialized);
    if (projectedTotal > maxTotalBytes) {
      console.warn(`O armazenamento local atingiria o limite seguro ao salvar ${key}.`);
      return false;
    }
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`Falha ao persistir ${key}.`, error);
    return false;
  }
}

export function persistSafely(key: string, value: unknown, maxBytes = DEFAULT_MAX_ITEM_BYTES): boolean {
  try {
    return persistTextSafely(key, JSON.stringify(value), maxBytes);
  } catch {
    return false;
  }
}
