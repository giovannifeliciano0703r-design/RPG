const STORAGE_KEY = 'rpg-game-state-v1';

/** Save any serializable game state to localStorage. */
export function saveGame<T>(state: T): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Não foi possível salvar o jogo:', error);
    return false;
  }
}

/** Load a previously saved game state. Returns null when no save exists. */
export function loadGame<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.error('Não foi possível carregar o jogo:', error);
    return null;
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function clearGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
