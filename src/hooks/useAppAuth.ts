import { useCallback, useEffect, useState } from "react";
import type { RpgSystem, UserProfile } from "../types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { toUserProfile } from "../auth/supabaseAuth";

type Options = {
  onPreferredSystem: (system: RpgSystem) => void;
};

export const AUTH_CHECK_TIMEOUT_MS = 10_000;

export function useAppAuth({ onPreferredSystem }: Options) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [authCheckError, setAuthCheckError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured || !supabase) {
      setCurrentUser(null);
      setIsAuthChecking(false);
      return () => { cancelled = true; };
    }
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      setAuthCheckError("Não foi possível validar sua sessão. Verifique sua conexão e tente entrar novamente.");
      setIsAuthChecking(false);
    }, AUTH_CHECK_TIMEOUT_MS);
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        if (!cancelled) setCurrentUser(null);
        return;
      }
      const { data: assurance } = await supabase!.auth.mfa.getAuthenticatorAssuranceLevel();
      const needsMfa = assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2";
      if (!cancelled) setCurrentUser(needsMfa ? null : await toUserProfile(data.user));
    })
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timeout);
        if (!cancelled) setIsAuthChecking(false);
      });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        setCurrentUser(null);
      } else if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        void toUserProfile(session.user).then((profile) => { if (!cancelled) setCurrentUser(profile); });
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "MFA_CHALLENGE_VERIFIED") {
        void supabase!.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data: assurance }) => {
          const needsMfa = assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2";
          if (needsMfa) { if (!cancelled) setCurrentUser(null); return; }
          void toUserProfile(session.user).then((profile) => { if (!cancelled) setCurrentUser(profile); });
        });
      }
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    if (user.favoriteSystem) onPreferredSystem(user.favoriteSystem);
  }, [onPreferredSystem]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsPasswordRecovery(false);
    if (supabase) void supabase.auth.signOut().catch(() => undefined);
  }, []);

  return { currentUser, setCurrentUser, isAuthChecking, authCheckError, isPasswordRecovery, clearPasswordRecovery: () => setIsPasswordRecovery(false), login, logout };
}
