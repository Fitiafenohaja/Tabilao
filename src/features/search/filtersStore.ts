import { create } from 'zustand';

import type { RecordQuery } from '@/data/repositories';
import { isoDaysFromToday } from '@/services/dates';
import { todayIso } from '@/services/tables';

export type Period = 'all' | 'today' | 'week' | 'month';

type FiltersState = {
  search: string;
  period: Period;
  /** Clé d'une option de `sortOptions` (« newest », « largest », « az »…). */
  sortKey: string;
  /** Filtre sur une liste de choix : Paiement = MVola. */
  equals: { fieldId: string; value: string } | null;
  setSearch: (search: string) => void;
  setPeriod: (period: Period) => void;
  setSortKey: (sortKey: string) => void;
  setEquals: (equals: { fieldId: string; value: string } | null) => void;
  reset: () => void;
};

const initial = { search: '', period: 'all' as Period, sortKey: 'newest', equals: null };

/** Filtres de consultation du tableau sélectionné ; réinitialisation en un geste. */
export const useFilters = create<FiltersState>((set) => ({
  ...initial,
  setSearch: (search) => set({ search }),
  setPeriod: (period) => set({ period }),
  setSortKey: (sortKey) => set({ sortKey }),
  setEquals: (equals) => set({ equals }),
  reset: () => set(initial),
}));

// Dates locales (heure du téléphone) : en UTC, Madagascar (UTC+3) changeait de jour à 3 h du matin.
const isoDaysAgo = (days: number) => isoDaysFromToday(-days);

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
