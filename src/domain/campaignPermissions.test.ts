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
    expect(getCampaignPermissions(campaign, "owner")).toMatchObject({ isOwner: true, canEditMaps: true, canManageInitiative: true, canEditSharedMacros: true, canInvitePlayers: true, canKickPlayers: true });
  });

  it("respeita apenas permissões delegadas ao CoMestre", () => {
    expect(getCampaignPermissions(campaign, "cogm")).toMatchObject({ isOwner: false, canEditMaps: true, canManageInitiative: false, canEditSharedMacros: true });
    expect(getCampaignPermissions(campaign, "player")).toMatchObject({ isOwner: false, canEditMaps: false, canManageInitiative: false, canEditSharedMacros: false, canInvitePlayers: false, canKickPlayers: false });
  });
});
