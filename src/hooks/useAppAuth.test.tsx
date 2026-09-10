// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AUTH_CHECK_TIMEOUT_MS, useAppAuth } from "./useAppAuth";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("../lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getUser: mocks.getUser,
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: mocks.unsubscribe } } })),
    },
  },
}));
vi.mock("../auth/supabaseAuth", () => ({ toUserProfile: vi.fn() }));

let root: Root;
let host: HTMLDivElement;
let latest: ReturnType<typeof useAppAuth>;

function Harness() {
  const result = useAppAuth({ onPreferredSystem: vi.fn() });
  useEffect(() => { latest = result; }, [result]);
  return null;
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  mocks.getUser.mockReturnValue(new Promise(() => undefined));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Harness />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("releases the authentication loading screen when Supabase does not respond", async () => {
  expect(latest.isAuthChecking).toBe(true);
  await act(async () => vi.advanceTimersByTimeAsync(AUTH_CHECK_TIMEOUT_MS));
  expect(latest.isAuthChecking).toBe(false);
  expect(latest.authCheckError).toMatch(/validar sua sessão/i);
});

it("clears the timeout and unsubscribes when unmounted", async () => {
  await act(async () => root.unmount());
  await act(async () => vi.advanceTimersByTimeAsync(AUTH_CHECK_TIMEOUT_MS));
  expect(mocks.unsubscribe).toHaveBeenCalledOnce();
});
