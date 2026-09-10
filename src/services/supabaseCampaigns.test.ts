import { describe, expect, it } from "vitest";
import { sanitizeRemoteMessageMetadata } from "./supabaseCampaigns";

describe("sanitizeRemoteMessageMetadata", () => {
  it("preserves bounded rich-message fields", () => {
    expect(sanitizeRemoteMessageMetadata({
      senderName: "Eldrin",
      imageUrl: "https://example.com/map.webp",
      rollData: { formula: "1d20+3", total: 18, rolls: [15] },
    })).toMatchObject({
      senderName: "Eldrin",
      imageUrl: "https://example.com/map.webp",
      rollData: { formula: "1d20+3", total: 18, rolls: [15] },
    });
  });

  it("drops malformed arrays, unsafe image URLs and invalid roll objects", () => {
    expect(sanitizeRemoteMessageMetadata({
      imageUrl: "javascript:alert(1)",
      rollData: { formula: "1d20", total: "twenty", rolls: "not-an-array" },
    })).toEqual({
      senderName: undefined,
      senderAvatar: undefined,
      characterId: undefined,
      rollData: undefined,
      imageUrl: undefined,
    });
  });
});
