import { STORAGE_KEYS } from "../constants/storageKeys";
import { normalizeRpgSystem } from "../domain/rpgSystems";

const USERS_KEY = STORAGE_KEYS.registeredUsers;
const CURRENT_USER_KEY = STORAGE_KEYS.currentUser;

export function sanitizeLocalProfile(user: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.authorization;
  sanitized["isAdmin"] = false;
  if (sanitized["role"] === "Administrador (ADM)" || sanitized["role"] === "Admin") {
    sanitized["role"] = "Mestre da Mesa";
  }
  sanitized["favoriteSystem"] = normalizeRpgSystem(sanitized["favoriteSystem"]);
  return sanitized;
}

/** Removes authentication artifacts from older local/demo builds. */
export function migrateStoredUsers(): void {
  try {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem("mestre_arcano_registered_users");
    localStorage.removeItem("mestre_arcano_current_user");
    for (const obsoleteKey of [
      "mestre_arcano_chat_history:v2",
      "mestre_arcano_grimoire:v2",
      "mestre_arcano_custom_knowledge:v2",
      "mestre_arcano_relatorio:v2",
      "relatorio_data:v2",
      "mestre_arcano_chat_history",
      "mestre_arcano_grimoire",
      "mestre_arcano_custom_knowledge",
      "mestre_arcano_relatorio",
      "relatorio_data",
    ]) localStorage.removeItem(obsoleteKey);
  } catch (error) {
    console.warn("Não foi possível remover perfis locais antigos.", error);
  }
}

