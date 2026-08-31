import { useCallback, useEffect, useState } from "react";
import type { RpgSystem, UserProfile } from "../types";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { sanitizeLocalProfile } from "../utils/securityMigration";
import { persistSafely } from "../utils/storageGuard";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { toUserProfile } from "../auth/supabaseAuth";

type Options = {
  onStorageError: (key: string) => void;
  onPreferredSystem: (system: RpgSystem) => void;
};

function readLocalUser(): UserProfile | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || "null");
    return parsed && typeof parsed === "object" ? parsed as UserProfile : null;
  } catch {
    return null;
  }
}

export function useAppAuth({ onStorageError, onPreferredSystem }: Options) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(readLocalUser);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (isSupabaseConfigured && supabase) {
      void supabase.auth.getUser().then(async ({ data }) => {
        if (!cancelled && data.user) setCurrentUser(await toUserProfile(data.user));
      }).catch(() => undefined).finally(() => {
        if (!cancelled) setIsAuthChecking(false);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT" && !cancelled) setCurrentUser(null);
      });
      return () => {
        cancelled = true;
        listener.subscription.unsubscribe();
      };
    }
    void fetch("/api/auth/session", { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(async (response) => response.ok ? response.json() : { user: null })
      .then((payload) => { if (!cancelled && payload.user) setCurrentUser(payload.user as UserProfile); })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setIsAuthChecking(false); });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback((user: UserProfile, remember = true) => {
    setCurrentUser(user);
    try {
      if (remember) {
        if (!persistSafely(STORAGE_KEYS.currentUser, sanitizeLocalProfile(user as unknown as Record<string, unknown>))) onStorageError(STORAGE_KEYS.currentUser);
      } else {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
      }
    } catch {
      onStorageError(STORAGE_KEYS.currentUser);
    }
    if (user.favoriteSystem) onPreferredSystem(user.favoriteSystem);
  }, [onPreferredSystem, onStorageError]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try { localStorage.removeItem(STORAGE_KEYS.currentUser); } catch { /* storage may be unavailable */ }
    void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    if (supabase) void supabase.auth.signOut().catch(() => undefined);
  }, []);

  return { currentUser, setCurrentUser, isAuthChecking, login, logout };
}
