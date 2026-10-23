import { create } from 'zustand';

import type { RecordQuery } from '@/data/repositories';
import { todayIso } from '@/services/tables';

export type Period = 'all' | 'today' | 'week' | 'month';

type FiltersState = {
  search: string;
  period: Period;
  sortDirection: 'asc' | 'desc';
  setSearch: (search: string) => void;
  setPeriod: (period: Period) => void;
  toggleSort: () => void;
  reset: () => void;
};

const initial = { search: '', period: 'all' as Period, sortDirection: 'desc' as const };

/** Filtres de consultation du tableau sélectionné ; réinitialisation en un geste. */
export const useFilters = create<FiltersState>((set) => ({
  ...initial,
  setSearch: (search) => set({ search }),
  setPeriod: (period) => set({ period }),
  toggleSort: () => set((s) => ({ sortDirection: s.sortDirection === 'asc' ? 'desc' : 'asc' })),
  reset: () => set(initial),
}));

const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export function periodRange(period: Period): Pick<RecordQuery, 'from' | 'to'> {
  switch (period) {
    case 'today':
      return { from: todayIso(), to: todayIso() };
    case 'week':
      return { from: isoDaysAgo(6), to: todayIso() };
    case 'month':
      return { from: `${todayIso().slice(0, 7)}-01`, to: todayIso() };
    default:
      return {};
  }
}
