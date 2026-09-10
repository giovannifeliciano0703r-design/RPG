import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("../lib/supabase", () => ({
  supabase: { rpc },
}));

import { CampaignStateConflictError, moveOwnedCampaignToken } from "./supabaseCampaigns";

describe("moveOwnedCampaignToken", () => {
  beforeEach(() => rpc.mockReset());

  it("sends only the owned-token movement and expected map revision", async () => {
    rpc.mockResolvedValue({ data: 12, error: null });

    await expect(moveOwnedCampaignToken("campaign-1", "token-1", 120, 240, 11)).resolves.toBe(12);
    expect(rpc).toHaveBeenCalledWith("move_owned_campaign_token", {
      target_campaign: "campaign-1",
      target_token_id: "token-1",
      target_x: 120,
      target_y: 240,
      expected_revision: 11,
    });
  });

  it("maps a stale revision to the campaign conflict flow", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "40001" } });

    await expect(moveOwnedCampaignToken("campaign-1", "token-1", 0, 0, 3))
      .rejects.toBeInstanceOf(CampaignStateConflictError);
  });
});
