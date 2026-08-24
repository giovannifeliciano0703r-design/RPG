import { useEffect } from "react";
import { persistSafely, persistTextSafely } from "../utils/storageGuard";

/** Persist state after a quiet period instead of serializing on every keystroke. */
export function useDebouncedLocalStorage<T>(
  key: string,
  value: T,
  delay = 500,
  maxBytes?: number,
  onError?: (key: string) => void,
): void {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!persistSafely(key, value, maxBytes)) onError?.(key);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [key, value, delay, maxBytes, onError]);
}

export function useDebouncedLocalStorageText(
  key: string,
  value: string,
  delay = 300,
  onError?: (key: string) => void,
): void {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!persistTextSafely(key, value)) onError?.(key);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [key, value, delay, onError]);
}
