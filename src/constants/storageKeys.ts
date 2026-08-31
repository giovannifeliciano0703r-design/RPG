export const STORAGE_KEYS = {
  system: "mestre_arcano_system:v2",
  currentUser: "mestre_arcano_current_user:v2",
  registeredUsers: "mestre_arcano_registered_users:v2",
  characters: "mestre_arcano_characters:v2",
  monsters: "mestre_arcano_monsters:v2",
  macros: "mestre_arcano_macros:v2",
  npcFolders: "mestre_arcano_npc_folders:v2",
  npcs: "mestre_arcano_npcs:v2",
  campaigns: "mestre_arcano_campaigns:v2",
  campaignChat: "mestre_arcano_campaign_chat:v2",
  battlemap: "mestre_arcano_battlemap:v2",
  initiative: "mestre_arcano_initiative:v2",
} as const;

const LEGACY_KEYS: Record<keyof typeof STORAGE_KEYS, string> = {
  system: "mestre_arcano_system",
  currentUser: "mestre_arcano_current_user",
  registeredUsers: "mestre_arcano_registered_users",
  characters: "mestre_arcano_characters",
  monsters: "mestre_arcano_monsters",
  macros: "mestre_arcano_macros",
  npcFolders: "mestre_arcano_npc_folders",
  npcs: "mestre_arcano_npcs",
  campaigns: "mestre_arcano_campaigns",
  campaignChat: "mestre_arcano_campaign_chat",
  battlemap: "mestre_arcano_battlemap",
  initiative: "mestre_arcano_initiative",
};

export function migrateLocalStorageSchema(): void {
  try {
    for (const name of Object.keys(STORAGE_KEYS) as Array<keyof typeof STORAGE_KEYS>) {
      const versionedKey = STORAGE_KEYS[name];
      const legacyKey = LEGACY_KEYS[name];
      if (localStorage.getItem(versionedKey) === null) {
        const legacyValue = localStorage.getItem(legacyKey);
        if (legacyValue !== null) localStorage.setItem(versionedKey, legacyValue);
      }
      localStorage.removeItem(legacyKey);
    }
  } catch (error) {
    console.warn("Não foi possível concluir a migração do armazenamento local.", error);
  }
}
