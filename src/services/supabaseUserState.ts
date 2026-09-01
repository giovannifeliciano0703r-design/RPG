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

export type LoadedUserAppState = { state: Partial<UserAppState>; revisions: Record<string, number> };

export class UserAppStateConflictError extends Error {
  constructor() { super("Seus dados foram alterados em outro aparelho. A versão mais recente foi carregada."); }
}

export async function loadUserAppState(userId: string): Promise<LoadedUserAppState> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase
    .from("user_app_state")
    .select("state_key,payload,revision")
    .eq("user_id", userId);
  if (error) throw error;

  const propertyByColumn = new Map(STATE_COLUMNS.map(([property, column]) => [column, property]));
  const result: Partial<UserAppState> = {};
  const revisions: Record<string, number> = {};
  for (const row of data ?? []) {
    const property = propertyByColumn.get(row.state_key as string);
    if (property) (result as Record<string, unknown>)[property] = row.payload;
    revisions[row.state_key as string] = Number(row.revision || 0);
  }
  return { state: result, revisions };
}

export async function saveUserAppState(userId: string, state: UserAppState, revisions: Record<string, number> = {}): Promise<Record<string, number>> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.id !== userId) throw new Error("A sessão não corresponde à conta ativa.");
  const rows = STATE_COLUMNS.map(([property, stateKey]) => ({
    stateKey, payload: state[property], expectedRevision: revisions[stateKey] || 0,
  }));
  const { data, error } = await supabase.rpc("save_my_app_state_batch", { target_rows: rows });
  if (error?.code === "40001") throw new UserAppStateConflictError();
  if (error) throw error;
  return Object.fromEntries(Object.entries((data ?? {}) as Record<string, unknown>).map(([key, value]) => [key, Number(value)]));
}
