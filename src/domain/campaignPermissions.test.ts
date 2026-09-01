import { describe, expect, it } from "vitest";
import { getCampaignPermissions } from "./campaignPermissions";
import type { Campaign } from "../types";

const campaign = {
  gmUserId: "owner",
  members: [
    { userId: "owner", role: "GM" },
    { userId: "cogm", role: "CO_GM", coGmPermissions: { canEditMaps: true, canManageInitiative: false, canEditSharedMacros: true } },
    { userId: "player", role: "PLAYER" },
  ],
} as Campaign;

describe("getCampaignPermissions", () => {
  it("concede todos os controles ao dono", () => {
    expect(getCampaignPermissions(campaign, "owner")).toEqual({ isOwner: true, canEditMaps: true, canManageInitiative: true, canEditSharedMacros: true });
  });

  it("respeita apenas permissões delegadas ao CoMestre", () => {
    expect(getCampaignPermissions(campaign, "cogm")).toEqual({ isOwner: false, canEditMaps: true, canManageInitiative: false, canEditSharedMacros: true });
    expect(getCampaignPermissions(campaign, "player")).toEqual({ isOwner: false, canEditMaps: false, canManageInitiative: false, canEditSharedMacros: false });
  });
});
