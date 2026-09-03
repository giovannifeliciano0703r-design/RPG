// @vitest-environment jsdom
import { act, useCallback, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSupabaseUserState } from "./useSupabaseUserState";
import type { UserAppState } from "../services/supabaseUserState";
import { UserAppStateConflictError } from "../services/supabaseUserState";

const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), subscribe: vi.fn(), remove: vi.fn(), error: vi.fn() }));
vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true, supabase: { removeChannel: mocks.remove } }));
vi.mock("../services/supabaseUserState", async (importOriginal) => ({
  ...await importOriginal<typeof import("../services/supabaseUserState")>(),
  loadUserAppState: mocks.load,
  saveUserAppState: mocks.save,
  subscribeToUserAppState: mocks.subscribe,
}));

const initial = {
  activeSystem: "Outro / não especificar", characters: [], monsters: [], macros: [],
  npcFolders: [], npcs: [], campaigns: [], campaignMessages: [], battleMapData: {}, initiativeState: {},
} as unknown as UserAppState;
const fresh = () => initial;
let root: Root;
let host: HTMLDivElement;
let edit: (patch: Partial<UserAppState>) => void;
let status: ReturnType<typeof useSupabaseUserState>;
let switchAccount: (id: string) => void;
let snapshot: UserAppState;

function Harness() {
  const [state, setState] = useState(initial);
  const [userId, setUserId] = useState("account-a");
  const applyState = useCallback((patch: Partial<UserAppState>) => setState((old) => ({ ...old, ...patch })), []);
  const currentStatus = useSupabaseUserState({ userId, state, applyState, createFreshState: fresh, onError: mocks.error });
  useEffect(() => {
    switchAccount = setUserId;
    snapshot = state;
    edit = applyState;
    status = currentStatus;
  }, [state, applyState, currentStatus]);
  return null;
}

async function advance(milliseconds: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  localStorage.clear();
  mocks.load.mockResolvedValue({ state: initial, revisions: {} });
  mocks.save.mockResolvedValue({ characters: 1 });
  mocks.subscribe.mockReturnValue({});
  mocks.remove.mockResolvedValue(undefined);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => { root.render(<Harness />); });
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("account synchronization lifecycle", () => {
  it("keeps offline edits pending and saves them after reconnecting", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    const characters = [{ id: "offline-character" }] as UserAppState["characters"];
    await act(async () => edit({ characters }));
    await advance(5000);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(status.isSynced).toBe(false);

    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    await act(async () => { window.dispatchEvent(new Event("online")); });
    await advance(900);
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(mocks.save.mock.calls[0][1].characters).toBe(characters);
    expect(status.isSynced).toBe(true);
  });

  it("backs off failed writes and resets the delay after success", async () => {
    mocks.save.mockRejectedValueOnce(new Error("offline"));
    await act(async () => edit({ characters: [{ id: "pending" }] as UserAppState["characters"] }));
    await advance(900);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(status.isSynced).toBe(false);
    await advance(1799);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(status.isSynced).toBe(true);
    await act(async () => edit({ characters: [] }));
    await advance(900);
    expect(mocks.save).toHaveBeenCalledTimes(3);
  });

  it("cancels queued writes when unmounted", async () => {
    await act(async () => edit({ characters: [] }));
    await act(async () => root.unmount());
    await advance(5000);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("discards a conflict reload completed after switching accounts", async () => {
    let completeRecovery!: (value: { state: UserAppState; revisions: Record<string, number> }) => void;
    mocks.load.mockImplementationOnce(() => new Promise((resolve) => { completeRecovery = resolve; }));
    mocks.save.mockRejectedValueOnce(new UserAppStateConflictError());
    await act(async () => edit({ characters: [{ id: "account-a-edit" }] as UserAppState["characters"] }));
    await advance(900);
    const otherAccount = { ...initial, characters: [{ id: "account-b-only" }] as UserAppState["characters"] };
    mocks.load.mockResolvedValueOnce({ state: otherAccount, revisions: { characters: 4 } });
    await act(async () => switchAccount("account-b"));
    expect(snapshot.characters).toBe(otherAccount.characters);
    await act(async () => completeRecovery({
      state: { ...initial, characters: [{ id: "stale-account-a" }] as UserAppState["characters"] },
      revisions: { characters: 99 },
    }));
    expect(snapshot.characters).toBe(otherAccount.characters);
    expect(mocks.error).not.toHaveBeenCalled();
  });
});
