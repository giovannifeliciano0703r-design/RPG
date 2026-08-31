import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaAsset } from "../types";
import { loadStoredMediaAssets, replaceStoredMediaAssets, revokeMediaObjectUrls } from "../utils/mediaStorage";

const LEGACY_MEDIA_KEY = "mestre_arcano_media";

export function useMediaAssets() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const assetsRef = useRef<MediaAsset[]>([]);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const revisionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const legacy = localStorage.getItem(LEGACY_MEDIA_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) await replaceStoredMediaAssets(parsed as MediaAsset[]);
          localStorage.removeItem(LEGACY_MEDIA_KEY);
        }
        const loaded = await loadStoredMediaAssets();
        if (!cancelled) {
          assetsRef.current = loaded;
          setAssets(loaded);
        } else {
          revokeMediaObjectUrls(loaded);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar a biblioteca de mídia.");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
      revokeMediaObjectUrls(assetsRef.current);
    };
  }, []);

  const saveAssets = useCallback((nextAssets: MediaAsset[]) => {
    const revision = revisionRef.current + 1;
    revisionRef.current = revision;
    const removed = assetsRef.current.filter((asset) => !nextAssets.some((next) => next.id === asset.id));
    revokeMediaObjectUrls(removed);
    assetsRef.current = nextAssets;
    setAssets(nextAssets);
    setError(null);
    writeQueueRef.current = writeQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await replaceStoredMediaAssets(nextAssets);
        const refreshed = await loadStoredMediaAssets();
        if (revision !== revisionRef.current) {
          revokeMediaObjectUrls(refreshed);
          return;
        }
        revokeMediaObjectUrls(assetsRef.current.filter((asset) => asset.originalUrl.startsWith("blob:")));
        assetsRef.current = refreshed;
        setAssets(refreshed);
      })
      .catch((cause) => {
        if (revision === revisionRef.current) {
          setError(cause instanceof Error ? cause.message : "Não foi possível salvar a mídia no navegador.");
        }
      });
  }, []);

  const clearMediaStorageError = useCallback(() => setError(null), []);
  return { mediaAssets: assets, saveMediaAssets: saveAssets, mediaStorageError: error, clearMediaStorageError };
}
