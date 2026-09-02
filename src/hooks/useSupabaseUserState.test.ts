import { describe, expect, it } from "vitest";
import { selectChangedUserStateKeys, selectInitialAccountState } from "./useSupabaseUserState";
import type { UserAppState } from "../services/supabaseUserState";

describe("selectInitialAccountState", () => {
  it("reutiliza cache somente para a mesma conta", () => {
    expect(selectInitialAccountState("user-a", "user-a", "cached", "fresh")).toBe("cached");
    expect(selectInitialAccountState("user-a", "user-b", "cached", "fresh")).toBe("fresh");
  });

  it("não atribui cache legado sem dono a uma conta nova", () => {
    expect(selectInitialAccountState(null, "user-a", "legacy", "fresh")).toBe("fresh");
  });
});

it("selects only account sections whose references changed", () => {
  const state = {
    activeSystem: "Outro / não especificar",
    characters: [], monsters: [], macros: [], npcFolders: [], npcs: [], campaigns: [],
    campaignMessages: [], battleMapData: {}, initiativeState: {},
  } as unknown as UserAppState;
  expect(selectChangedUserStateKeys(state, state)).toEqual([]);
  expect(selectChangedUserStateKeys(state, { ...state, characters: [] })).toEqual(["characters"]);
});
