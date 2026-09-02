import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { loadUserAppState, saveUserAppState, STATE_COLUMNS, subscribeToUserAppState, UserAppStateConflictError, type UserAppState, type UserAppStateKey } from "../services/supabaseUserState";

const CACHE_OWNER_KEY = "mestre_arcano_cache_owner:v1";

export function selectInitialAccountState<T>(cachedOwner: string | null, userId: string, cachedState: T, freshState: T): T {
  return cachedOwner === userId ? cachedState : freshState;
}

export function selectChangedUserStateKeys(previous: Partial<UserAppState>, current: UserAppState): UserAppStateKey[] {
  return STATE_COLUMNS.map(([property]) => property).filter((property) => previous[property] !== current[property]);
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
  const activeUserRef = useRef(userId);
  const revisionsRef = useRef<Record<string, number>>({});
  const lastSyncedStateRef = useRef<Partial<UserAppState>>({});
  const saveInFlightRef = useRef(false);
  const saveRequestedRef = useRef(false);
  const [saveSequence, setSaveSequence] = useState(0);
  stateRef.current = state;
  applyStateRef.current = applyState;
  createFreshStateRef.current = createFreshState;
  onErrorRef.current = onError;
  activeUserRef.current = userId;

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
          lastSyncedStateRef.current = remoteState;
          applyStateRef.current(remoteState);
        } else {
          const cachedOwner = localStorage.getItem(CACHE_OWNER_KEY);
          const initialState = selectInitialAccountState(cachedOwner, userId, stateRef.current, createFreshStateRef.current());
          if (cachedOwner !== userId) applyStateRef.current(initialState);
          revisionsRef.current = await saveUserAppState(userId, initialState);
          lastSyncedStateRef.current = initialState;
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
      lastSyncedStateRef.current = { ...lastSyncedStateRef.current, ...patch };
      applyStateRef.current(patch);
      setIsSynced(true);
    });
    return () => { if (channel) void client.removeChannel(channel); };
  }, [isLoading, userId]);

  useEffect(() => {
    if (!userId || hydratedUserRef.current !== userId) return;
    setIsSynced(false);
    const timer = window.setTimeout(() => {
      if (saveInFlightRef.current) {
        saveRequestedRef.current = true;
        return;
      }
      const snapshot = stateRef.current;
      const changedProperties = selectChangedUserStateKeys(lastSyncedStateRef.current, snapshot);
      if (changedProperties.length === 0) {
        setIsSynced(true);
        return;
      }
      saveInFlightRef.current = true;
      void saveUserAppState(userId, snapshot, revisionsRef.current, changedProperties)
        .then((revisions) => {
          if (activeUserRef.current !== userId) return;
          revisionsRef.current = revisions;
          const nextSynced = { ...lastSyncedStateRef.current };
          for (const property of changedProperties) (nextSynced as Record<string, unknown>)[property] = snapshot[property];
          lastSyncedStateRef.current = nextSynced;
          setIsSynced(selectChangedUserStateKeys(nextSynced, stateRef.current).length === 0);
        })
        .catch(async (cause) => {
          if (activeUserRef.current !== userId) return;
          if (cause instanceof UserAppStateConflictError) {
            const latest = await loadUserAppState(userId);
            revisionsRef.current = latest.revisions;
            lastSyncedStateRef.current = latest.state;
            applyStateRef.current(latest.state);
          }
          onErrorRef.current(cause instanceof Error ? cause.message : "Falha ao salvar seus dados online.");
        })
        .finally(() => {
          saveInFlightRef.current = false;
          if (activeUserRef.current !== userId) {
            setSaveSequence((sequence) => sequence + 1);
            return;
          }
          const hasPendingChanges = selectChangedUserStateKeys(lastSyncedStateRef.current, stateRef.current).length > 0;
          if (saveRequestedRef.current || hasPendingChanges) {
            saveRequestedRef.current = false;
            setSaveSequence((sequence) => sequence + 1);
          }
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
    saveSequence,
  ]);

  return {
    isLoading: Boolean(userId) && (isLoading || hydratedUserRef.current !== userId),
    isSynced,
    loadError,
    retry: () => setRetryAttempt((attempt) => attempt + 1),
  };
}
