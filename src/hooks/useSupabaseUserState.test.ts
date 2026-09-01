import { describe, expect, it } from "vitest";
import { selectInitialAccountState } from "./useSupabaseUserState";

describe("selectInitialAccountState", () => {
  it("reutiliza cache somente para a mesma conta", () => {
    expect(selectInitialAccountState("user-a", "user-a", "cached", "fresh")).toBe("cached");
    expect(selectInitialAccountState("user-a", "user-b", "cached", "fresh")).toBe("fresh");
  });

  it("não atribui cache legado sem dono a uma conta nova", () => {
    expect(selectInitialAccountState(null, "user-a", "legacy", "fresh")).toBe("fresh");
  });
});
