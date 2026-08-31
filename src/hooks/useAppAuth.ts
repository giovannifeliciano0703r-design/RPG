import { useCallback, useEffect, useState } from "react";
import type { RpgSystem, UserProfile } from "../types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { toUserProfile } from "../auth/supabaseAuth";

type Options = {
  onPreferredSystem: (system: RpgSystem) => void;
};

export function useAppAuth({ onPreferredSystem }: Options) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured || !supabase) {
      setCurrentUser(null);
      setIsAuthChecking(false);
      return () => { cancelled = true; };
    }
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!cancelled) setCurrentUser(data.user ? await toUserProfile(data.user) : null);
    })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setIsAuthChecking(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        setCurrentUser(null);
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void toUserProfile(session.user).then((profile) => {
          if (!cancelled) setCurrentUser(profile);
        });
      }
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback((user: UserProfile) => {
    setCurrentUser(user);
    if (user.favoriteSystem) onPreferredSystem(user.favoriteSystem);
  }, [onPreferredSystem]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (supabase) void supabase.auth.signOut().catch(() => undefined);
  }, []);

  return { currentUser, setCurrentUser, isAuthChecking, login, logout };
}
