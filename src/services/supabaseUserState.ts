import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
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

export type UserAppStateKey = keyof UserAppState;

export const STATE_COLUMNS: Array<[UserAppStateKey, string]> = [
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
const CLIENT_INSTANCE_ID = crypto.randomUUID();
const PROPERTY_BY_COLUMN = new Map(STATE_COLUMNS.map(([property, column]) => [column, property]));

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

  const result: Partial<UserAppState> = {};
  const revisions: Record<string, number> = {};
  for (const row of data ?? []) {
    const property = PROPERTY_BY_COLUMN.get(row.state_key as string);
    if (property) (result as Record<string, unknown>)[property] = row.payload;
    revisions[row.state_key as string] = Number(row.revision || 0);
  }
  return { state: result, revisions };
}

export async function saveUserAppState(
  userId: string,
  state: UserAppState,
  revisions: Record<string, number> = {},
  properties: UserAppStateKey[] = STATE_COLUMNS.map(([property]) => property),
): Promise<Record<string, number>> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.id !== userId) throw new Error("A sessão não corresponde à conta ativa.");
  const selected = new Set(properties);
  const rows = STATE_COLUMNS.filter(([property]) => selected.has(property)).map(([property, stateKey]) => ({
    stateKey, payload: state[property], expectedRevision: revisions[stateKey] || 0,
  }));
  if (rows.length === 0) return revisions;
  const { data, error } = await supabase.rpc("save_my_app_state_batch", { target_rows: rows, target_writer: CLIENT_INSTANCE_ID });
  if (error?.code === "40001") throw new UserAppStateConflictError();
  if (error) throw error;
  return Object.fromEntries(Object.entries((data ?? {}) as Record<string, unknown>).map(([key, value]) => [key, Number(value)]));
}

export function subscribeToUserAppState(userId: string, onPatch: (patch: Partial<UserAppState>, stateKey: string, revision: number) => void): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase.channel(`user-state:${userId}`).on("postgres_changes", {
    event: "*", schema: "public", table: "user_app_state", filter: `user_id=eq.${userId}`,
  }, (event) => {
    const row = event.new as { state_key?: string; payload?: unknown; revision?: number; last_writer?: string };
    if (!row.state_key || row.last_writer === CLIENT_INSTANCE_ID) return;
    const property = PROPERTY_BY_COLUMN.get(row.state_key);
    if (property) onPatch({ [property]: row.payload } as Partial<UserAppState>, row.state_key, Number(row.revision || 0));
  }).subscribe();
}
