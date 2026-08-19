import { useEffect } from "react";

/** Persist state after a quiet period instead of serializing on every keystroke. */
export function useDebouncedLocalStorage<T>(key: string, value: T, delay = 400): void {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Não foi possível salvar ${key}. O armazenamento pode estar cheio.`, error);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [key, value, delay]);
}
