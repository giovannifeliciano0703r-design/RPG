import { useState } from "react";
import type { BattleMapData, Campaign, ChatMessage, InitiativeState } from "../types";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { normalizeRpgSystem } from "../domain/rpgSystems";
import { DEFAULT_BATTLEMAP, DEFAULT_INITIAL_CAMPAIGN, DEFAULT_INITIATIVE_STATE } from "../data/defaultAppData";

function readArray<T>(key: string): T[] | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed as T[] : null;
  } catch {
    return null;
  }
}

function readObject<T>(key: string): T | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as T : null;
  } catch {
    return null;
  }
}

const DEFAULT_CAMPAIGN_MESSAGES: ChatMessage[] = [
  {
    id: "msg-camp-1",
    senderId: "default-gm",
    senderName: "Mestre Arcano (GM)",
    channel: "IC",
    content: "Vocês adentram os portões rangentes das catacumbas. O ar é pesado e tochas crepitam nas paredes de pedra.",
    timestamp: Date.now() - 3_600_000,
    type: "TEXT",
  },
  {
    id: "msg-camp-2",
    senderId: "default-user",
    senderName: "Eldrin Lua-Negra",
    characterId: "char-eldrin-1",
    channel: "IC",
    content: "Ergo meu cajado e sussurro uma prece luminosa para revelar as sombras ao redor.",
    timestamp: Date.now() - 1_800_000,
    type: "TEXT",
  },
];

export function useCampaignWorkspace() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const stored = readArray<Campaign>(STORAGE_KEYS.campaigns);
    return stored?.map((campaign) => ({ ...campaign, system: normalizeRpgSystem(campaign.system) })) ?? [DEFAULT_INITIAL_CAMPAIGN];
  });
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(() => campaigns[0] || null);
  const [campaignMessages, setCampaignMessages] = useState<ChatMessage[]>(() => readArray<ChatMessage>(STORAGE_KEYS.campaignChat) ?? DEFAULT_CAMPAIGN_MESSAGES);
  const [battleMapData, setBattleMapData] = useState<BattleMapData>(() => readObject<BattleMapData>(STORAGE_KEYS.battlemap) ?? DEFAULT_BATTLEMAP);
  const [initiativeState, setInitiativeState] = useState<InitiativeState>(() => readObject<InitiativeState>(STORAGE_KEYS.initiative) ?? DEFAULT_INITIATIVE_STATE);

  return {
    campaigns, setCampaigns,
    activeCampaign, setActiveCampaign,
    campaignMessages, setCampaignMessages,
    battleMapData, setBattleMapData,
    initiativeState, setInitiativeState,
  };
}
