import { clearGame, hasSavedGame, loadGame, saveGame } from './storage';

export interface RpgBackup<T = unknown> {
  version: 1;
  createdAt: string;
  app: 'mestre-arcano';
  state: T;
}

export function createBackup<T>(state: T): RpgBackup<T> {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    app: 'mestre-arcano',
    state,
  };
}

export function downloadBackup<T>(state: T, filename = 'mestre-arcano-backup.json'): void {
  const backup = createBackup(state);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function restoreBackup<T>(backup: unknown): T | null {
  if (!backup || typeof backup !== 'object') return null;
  const candidate = backup as Partial<RpgBackup<T>>;
  if (candidate.version !== 1 || candidate.app !== 'mestre-arcano' || candidate.state === undefined) {
    return null;
  }
  return candidate.state as T;
}

export { clearGame, hasSavedGame, loadGame, saveGame };
