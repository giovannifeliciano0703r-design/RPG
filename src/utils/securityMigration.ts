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

/** One-time client migration for older demo builds that stored passwords. */
export function migrateStoredUsers(): void {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const users = JSON.parse(raw);
      if (Array.isArray(users)) {
        let changed = false;
        const sanitized = users.map((user) => {
          if (!user || typeof user !== "object") return user;
          if ("password" in user || "authorization" in user || user.isAdmin || user.role === "Administrador (ADM)") {
            changed = true;
            return sanitizeLocalProfile(user);
          }
          return user;
        });

        if (changed) localStorage.setItem(USERS_KEY, JSON.stringify(sanitized));
      }
    }
  } catch (error) {
    console.warn("Não foi possível migrar usuários armazenados.", error);
  }

  try {
    const rawCurrentUser = localStorage.getItem(CURRENT_USER_KEY);
    if (!rawCurrentUser) return;
    const currentUser = JSON.parse(rawCurrentUser);
    if (currentUser && typeof currentUser === "object") {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sanitizeLocalProfile(currentUser)));
    }
  } catch (error) {
    console.warn("Não foi possível remover privilégios locais antigos.", error);
  }
}

migrateStoredUsers();
