/** Yolk AI's memory — persisted locally, never leaves the device. */

const KEY = "golden-yolk-memory";

export interface Memory {
  visits?: number;
  lastTier?: string;
  plan?: { people: number; eggsEach: number; days: number };
}

export function loadMemory(): Memory {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveMemory(patch: Partial<Memory>): Memory {
  const next = { ...loadMemory(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — memory is optional */
  }
  return next;
}

export function bumpVisit(): Memory {
  const m = loadMemory();
  return saveMemory({ visits: (m.visits ?? 0) + 1 });
}
