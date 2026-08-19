const USERS_KEY = "mestre_arcano_registered_users";

/** One-time client migration for older demo builds that stored passwords. */
export function migrateStoredUsers(): void {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return;
    const users = JSON.parse(raw);
    if (!Array.isArray(users)) return;

    let changed = false;
    const sanitized = users.map((user) => {
      if (!user || typeof user !== "object") return user;
      if ("password" in user) {
        const { password: _password, ...safeUser } = user;
        changed = true;
        return safeUser;
      }
      return user;
    });

    if (changed) localStorage.setItem(USERS_KEY, JSON.stringify(sanitized));
  } catch (error) {
    console.warn("Não foi possível migrar usuários armazenados.", error);
  }
}

migrateStoredUsers();
