import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { loadUserAppState, saveUserAppState, subscribeToUserAppState, UserAppStateConflictError, type UserAppState } from "../services/supabaseUserState";

const CACHE_OWNER_KEY = "mestre_arcano_cache_owner:v1";

export function selectInitialAccountState<T>(cachedOwner: string | null, userId: string, cachedState: T, freshState: T): T {
  return cachedOwner === userId ? cachedState : freshState;
}

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const hydratedUserRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  const applyStateRef = useRef(applyState);
  const createFreshStateRef = useRef(createFreshState);
  const onErrorRef = useRef(onError);
  const revisionsRef = useRef<Record<string, number>>({});
  const skipNextSaveRef = useRef(false);
  stateRef.current = state;
  applyStateRef.current = applyState;
  createFreshStateRef.current = createFreshState;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) {
      hydratedUserRef.current = null;
      setIsLoading(false);
      setIsSynced(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsSynced(false);
    setLoadError(null);
    void loadUserAppState(userId)
      .then(async ({ state: remoteState, revisions }) => {
        if (cancelled) return;
        const hasRemoteState = Object.keys(remoteState).length > 0;
        if (hasRemoteState) {
          revisionsRef.current = revisions;
          applyStateRef.current(remoteState);
        } else {
          const cachedOwner = localStorage.getItem(CACHE_OWNER_KEY);
          const initialState = selectInitialAccountState(cachedOwner, userId, stateRef.current, createFreshStateRef.current());
          if (cachedOwner !== userId) applyStateRef.current(initialState);
          revisionsRef.current = await saveUserAppState(userId, initialState);
        }
        if (cancelled) return;
        localStorage.setItem(CACHE_OWNER_KEY, userId);
        hydratedUserRef.current = userId;
        setIsSynced(true);
      })
      .catch((cause) => {
        if (!cancelled) {
          const message = cause instanceof Error ? cause.message : "Falha ao carregar seus dados online.";
          setLoadError(message);
          onErrorRef.current(message);
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [retryAttempt, userId]);

  useEffect(() => {
    const client = supabase;
    if (!userId || hydratedUserRef.current !== userId || !client) return;
    const channel = subscribeToUserAppState(userId, (patch, stateKey, revision) => {
      revisionsRef.current[stateKey] = revision;
      skipNextSaveRef.current = true;
      applyStateRef.current(patch);
      setIsSynced(true);
    });
    return () => { if (channel) void client.removeChannel(channel); };
  }, [isLoading, userId]);

  useEffect(() => {
    if (!userId || hydratedUserRef.current !== userId) return;
    if (skipNextSaveRef.current) { skipNextSaveRef.current = false; return; }
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

  return {
    isLoading: Boolean(userId) && (isLoading || hydratedUserRef.current !== userId),
    isSynced,
    loadError,
    retry: () => setRetryAttempt((attempt) => attempt + 1),
  };
}
