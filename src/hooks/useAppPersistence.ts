import { useCallback } from "react";
import type {
  BattleMapData,
  Campaign,
  CharacterSheet,
  ChatMessage,
  InitiativeState,
  KnowledgeEntry,
  Macro,
  MonsterStatBlock,
  NpcEntry,
  NpcFolder,
  ParsedRpgCard,
  RpgSystem,
} from "../types";
import { useDebouncedLocalStorage, useDebouncedLocalStorageText } from "./useDebouncedLocalStorage";
import { STORAGE_KEYS } from "../constants/storageKeys";

interface PersistedAppState {
  activeSystem: RpgSystem;
  messages: ChatMessage[];
  savedCards: ParsedRpgCard[];
  customKnowledge: KnowledgeEntry[];
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

export function useAppPersistence(state: PersistedAppState, onStorageError: (key: string) => void): void {
  const reportError = useCallback((key: string) => onStorageError(key), [onStorageError]);
  useDebouncedLocalStorageText(STORAGE_KEYS.system, state.activeSystem, 300, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.chatHistory, state.messages, 600, 2 * 1024 * 1024, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.grimoire, state.savedCards, 600, undefined, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.customKnowledge, state.customKnowledge, 700, 2 * 1024 * 1024, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.characters, state.characters, 600, undefined, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.monsters, state.monsters, 800, 2 * 1024 * 1024, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.macros, state.macros, 500, undefined, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.npcFolders, state.npcFolders, 600, undefined, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.npcs, state.npcs, 600, undefined, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.campaigns, state.campaigns, 700, undefined, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.campaignChat, state.campaignMessages, 600, 2 * 1024 * 1024, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.battlemap, state.battleMapData, 500, 2 * 1024 * 1024, reportError);
  useDebouncedLocalStorage(STORAGE_KEYS.initiative, state.initiativeState, 400, undefined, reportError);
}
