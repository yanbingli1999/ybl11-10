import { ExpeditionRecord, GameState } from '../types/game';

const STORAGE_KEYS = {
  EXPEDITIONS: 'ruin_explorer_expeditions',
  TOTAL_GOLD: 'ruin_explorer_total_gold',
  BEST_DEPTH: 'ruin_explorer_best_depth',
  SAVED_GAME: 'ruin_explorer_saved_game',
};

export function saveExpeditionRecord(record: ExpeditionRecord): void {
  try {
    const records = getExpeditionRecords();
    records.unshift(record);
    const limited = records.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.EXPEDITIONS, JSON.stringify(limited));

    if (record.survived) {
      const totalGold = getTotalGold() + record.goldEarned;
      localStorage.setItem(STORAGE_KEYS.TOTAL_GOLD, String(totalGold));
    }

    const bestDepth = getBestDepth();
    if (record.depth > bestDepth) {
      localStorage.setItem(STORAGE_KEYS.BEST_DEPTH, String(record.depth));
    }
  } catch (e) {
    console.error('Failed to save expedition record:', e);
  }
}

export function getExpeditionRecords(): ExpeditionRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPEDITIONS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load expedition records:', e);
    return [];
  }
}

export function getTotalGold(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TOTAL_GOLD);
    return data ? parseInt(data, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export function getBestDepth(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BEST_DEPTH);
    return data ? parseInt(data, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export function saveGame(game: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(game));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

export function loadSavedGame(): GameState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_GAME);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load saved game:', e);
    return null;
  }
}

export function clearSavedGame(): void {
  localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SAVED_GAME) !== null;
}
