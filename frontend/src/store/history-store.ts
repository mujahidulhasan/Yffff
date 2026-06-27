import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryEntry } from '@/types/api';

interface HistoryState {
  entries: HistoryEntry[];
  add: (entry: HistoryEntry) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const MAX_ENTRIES = 50;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((state) => ({
          entries: [entry, ...state.entries.filter((e) => e.id !== entry.id)].slice(
            0,
            MAX_ENTRIES
          ),
        })),
      remove: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'viddl-history' }
  )
);
