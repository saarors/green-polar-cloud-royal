import { create } from "zustand";

const BEST_KEY = "lumen-best-v1";

export type Phase = "title" | "playing" | "paused" | "won";

function loadBest(): number | null {
  try {
    const v = localStorage.getItem(BEST_KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function saveBest(t: number) {
  try {
    localStorage.setItem(BEST_KEY, String(t));
  } catch {
    /* ignore */
  }
}

type GameStore = {
  phase: Phase;
  time: number;
  collected: number;
  total: number;
  bestTime: number | null;
  lastTime: number;
  newBest: boolean;
  hint: string | null;
  muted: boolean;
  isTouch: boolean;
  locked: boolean;
  setPhase: (phase: Phase) => void;
  setTime: (time: number) => void;
  setProgress: (collected: number, total: number) => void;
  setHint: (hint: string | null) => void;
  setMuted: (muted: boolean) => void;
  setTouch: (isTouch: boolean) => void;
  setLocked: (locked: boolean) => void;
  recordWin: (time: number) => void;
  resetRun: () => void;
};

export const useGame = create<GameStore>((set, get) => ({
  phase: "title",
  time: 0,
  collected: 0,
  total: 7,
  bestTime: loadBest(),
  lastTime: 0,
  newBest: false,
  hint: null,
  muted: false,
  isTouch: false,
  locked: false,
  setPhase: (phase) => set({ phase }),
  setTime: (time) => set({ time }),
  setProgress: (collected, total) => set({ collected, total }),
  setHint: (hint) => set({ hint }),
  setMuted: (muted) => set({ muted }),
  setTouch: (isTouch) => set({ isTouch }),
  setLocked: (locked) => set({ locked }),
  recordWin: (time) => {
    const best = get().bestTime;
    const newBest = best === null || time < best;
    if (newBest) saveBest(time);
    set({
      phase: "won",
      lastTime: time,
      bestTime: newBest ? time : best,
      newBest,
      hint: null,
    });
  },
  resetRun: () =>
    set({
      phase: "title",
      time: 0,
      collected: 0,
      hint: null,
      lastTime: 0,
      newBest: false,
      locked: false,
    }),
}));

export function formatTime(seconds: number, precise = false) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (!precise) return `${m}:${s.toString().padStart(2, "0")}`;
  const t = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${t}`;
}
