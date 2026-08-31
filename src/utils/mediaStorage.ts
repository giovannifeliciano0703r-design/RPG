import type { MediaAsset } from "../types";

const DATABASE_NAME = "mestre_arcano_media";
const STORE_NAME = "assets";
const DATABASE_VERSION = 1;

interface StoredMediaAsset extends Omit<MediaAsset, "originalUrl" | "thumbnailUrl"> {
  original: Blob | string;
  thumbnail: Blob | string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha ao abrir a biblioteca de mídia."));
  });
}

function dataUrlToBlob(value: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(value);
  if (!match) throw new Error("Formato de imagem local inválido.");
  const mimeType = match[1] || "application/octet-stream";
  const bytes = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
  const buffer = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) buffer[index] = bytes.charCodeAt(index);
  return new Blob([buffer], { type: mimeType });
}

function toStoredValue(url: string, previous?: Blob | string): Blob | string {
  if (url.startsWith("data:")) return dataUrlToBlob(url);
  if (url.startsWith("blob:")) {
    if (previous) return previous;
    throw new Error("A URL temporária da imagem não possui uma cópia persistente.");
  }
  if (/^https:\/\//i.test(url)) return url;
  throw new Error("Somente imagens locais ou URLs HTTPS podem ser armazenadas.");
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Operação de mídia falhou."));
  });
}

export async function replaceStoredMediaAssets(assets: MediaAsset[]): Promise<void> {
  const database = await openDatabase();
  try {
    const readTransaction = database.transaction(STORE_NAME, "readonly");
    const previous = await requestResult(readTransaction.objectStore(STORE_NAME).getAll()) as StoredMediaAsset[];
    const previousById = new Map(previous.map((asset) => [asset.id, asset]));
    const storedAssets = assets.map((asset): StoredMediaAsset => {
      const { originalUrl, thumbnailUrl, ...metadata } = asset;
      const prior = previousById.get(asset.id);
      return {
        ...metadata,
        original: toStoredValue(originalUrl, prior?.original),
        thumbnail: toStoredValue(thumbnailUrl || originalUrl, prior?.thumbnail || prior?.original),
      };
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      storedAssets.forEach((asset) => store.put(asset));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao salvar a biblioteca de mídia."));
      transaction.onabort = () => reject(transaction.error ?? new Error("A gravação da biblioteca foi cancelada."));
    });
  } finally {
    database.close();
  }
}

function toRuntimeUrl(value: Blob | string): string {
  return value instanceof Blob ? URL.createObjectURL(value) : value;
}

export async function loadStoredMediaAssets(): Promise<MediaAsset[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const stored = await requestResult(transaction.objectStore(STORE_NAME).getAll()) as StoredMediaAsset[];
    return stored.map(({ original, thumbnail, ...metadata }) => ({
      ...metadata,
      originalUrl: toRuntimeUrl(original),
      thumbnailUrl: toRuntimeUrl(thumbnail),
    }));
  } finally {
    database.close();
  }
}

export function revokeMediaObjectUrls(assets: MediaAsset[]): void {
  assets.forEach((asset) => {
    if (asset.originalUrl.startsWith("blob:")) URL.revokeObjectURL(asset.originalUrl);
    if (asset.thumbnailUrl.startsWith("blob:")) URL.revokeObjectURL(asset.thumbnailUrl);
  });
}
