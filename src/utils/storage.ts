import type { GameState } from '../types';

const STORAGE_KEY = 'rpg-game-state-v1';

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Não foi possível salvar o jogo:', error);
  }
}

export function loadGame<T extends GameState>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.error('Não foi possível carregar o jogo:', error);
    return null;
  }
}

export function clearGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
