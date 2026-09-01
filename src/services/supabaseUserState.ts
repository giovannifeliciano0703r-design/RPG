import { supabase } from "../lib/supabase";
import type {
  BattleMapData,
  Campaign,
  CharacterSheet,
  ChatMessage,
  InitiativeState,
  Macro,
  MonsterStatBlock,
  NpcEntry,
  NpcFolder,
  RpgSystem,
} from "../types";

export interface UserAppState {
  activeSystem: RpgSystem;
  characters: CharacterSheet[];
  monsters: MonsterStatBlock[];
  macros: Macro[];
  npcFolders: NpcFolder[];
  npcs: NpcEntry[];
  campaigns: Campaign[];
  campaignMessages: ChatMessage[];
  battleMapData: BattleMapData;
  initiativeState: InitiativeState;
}

const STATE_COLUMNS: Array<[keyof UserAppState, string]> = [
  ["activeSystem", "active_system"],
  ["characters", "characters"],
  ["monsters", "monsters"],
  ["macros", "macros"],
  ["npcFolders", "npc_folders"],
  ["npcs", "npcs"],
  ["campaigns", "campaigns"],
  ["campaignMessages", "campaign_messages"],
  ["battleMapData", "battlemap"],
  ["initiativeState", "initiative"],
];

export async function loadUserAppState(userId: string): Promise<Partial<UserAppState>> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase
    .from("user_app_state")
    .select("state_key,payload")
    .eq("user_id", userId);
  if (error) throw error;

  const propertyByColumn = new Map(STATE_COLUMNS.map(([property, column]) => [column, property]));
  const result: Partial<UserAppState> = {};
  for (const row of data ?? []) {
    const property = propertyByColumn.get(row.state_key as string);
    if (property) (result as Record<string, unknown>)[property] = row.payload;
  }
  return result;
}

export async function saveUserAppState(userId: string, state: UserAppState): Promise<void> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const updatedAt = new Date().toISOString();
  const rows = STATE_COLUMNS.map(([property, stateKey]) => ({
    user_id: userId,
    state_key: stateKey,
    payload: state[property],
    updated_at: updatedAt,
  }));
  const { error } = await supabase.from("user_app_state").upsert(rows, { onConflict: "user_id,state_key" });
  if (error) throw error;
}

