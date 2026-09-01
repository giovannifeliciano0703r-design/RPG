import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { loadUserAppState, saveUserAppState, UserAppStateConflictError, type UserAppState } from "../services/supabaseUserState";

const CACHE_OWNER_KEY = "mestre_arcano_cache_owner:v1";

interface Options {
  userId?: string;
  state: UserAppState;
  applyState: (state: Partial<UserAppState>) => void;
  createFreshState: () => UserAppState;
  onError: (message: string) => void;
}

export function useSupabaseUserState({ userId, state, applyState, createFreshState, onError }: Options) {
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [isSynced, setIsSynced] = useState(false);
  const hydratedUserRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  const applyStateRef = useRef(applyState);
  const createFreshStateRef = useRef(createFreshState);
  const onErrorRef = useRef(onError);
  const revisionsRef = useRef<Record<string, number>>({});
  stateRef.current = state;
  applyStateRef.current = applyState;
  createFreshStateRef.current = createFreshState;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) {
      hydratedUserRef.current = null;
      setIsLoading(false);
      setIsSynced(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsSynced(false);
    void loadUserAppState(userId)
      .then(async ({ state: remoteState, revisions }) => {
        if (cancelled) return;
        const hasRemoteState = Object.keys(remoteState).length > 0;
        if (hasRemoteState) {
          revisionsRef.current = revisions;
          applyStateRef.current(remoteState);
        } else {
          const cachedOwner = localStorage.getItem(CACHE_OWNER_KEY);
          const initialState = cachedOwner === null || cachedOwner === userId
            ? stateRef.current
            : createFreshStateRef.current();
          if (cachedOwner && cachedOwner !== userId) applyStateRef.current(initialState);
          revisionsRef.current = await saveUserAppState(userId, initialState);
        }
        if (cancelled) return;
        localStorage.setItem(CACHE_OWNER_KEY, userId);
        hydratedUserRef.current = userId;
        setIsSynced(true);
      })
      .catch((cause) => {
        if (!cancelled) onErrorRef.current(cause instanceof Error ? cause.message : "Falha ao carregar seus dados online.");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId || hydratedUserRef.current !== userId) return;
    setIsSynced(false);
    const timer = window.setTimeout(() => {
      void saveUserAppState(userId, stateRef.current, revisionsRef.current)
        .then((revisions) => { revisionsRef.current = revisions; setIsSynced(true); })
        .catch(async (cause) => {
          if (cause instanceof UserAppStateConflictError) {
            const latest = await loadUserAppState(userId);
            revisionsRef.current = latest.revisions;
            applyStateRef.current(latest.state);
          }
          onErrorRef.current(cause instanceof Error ? cause.message : "Falha ao salvar seus dados online.");
        });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    userId,
    state.activeSystem,
    state.characters,
    state.monsters,
    state.macros,
    state.npcFolders,
    state.npcs,
    state.campaigns,
    state.campaignMessages,
    state.battleMapData,
    state.initiativeState,
  ]);

  return { isLoading: Boolean(userId) && (isLoading || hydratedUserRef.current !== userId), isSynced };
}
