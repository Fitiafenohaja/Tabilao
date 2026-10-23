import { create } from 'zustand';

import type { FieldType } from '@/data/schema';
import type { ImportReport, InvalidPolicy, RawSheet } from '@/services/import';

export type WizardStep = 'file' | 'mapping' | 'check' | 'report';

export type NewColumnConfig = { include: boolean; name: string; type: FieldType };

/** État de l'assistant d'import (étapes 1 à 10 du cahier des charges §5.9). */
type ImportState = {
  step: WizardStep;
  fileName: string | null;
  bytes: Uint8Array | null;
  isCsv: boolean;
  sheets: string[];
  sheet: RawSheet | null;
  headerRow: number;
  target: 'new' | 'existing';
  newTableName: string;
  tableId: string | null;
  /** Nouveau tableau : configuration de chaque colonne. */
  columns: NewColumnConfig[];
  /** Tableau existant : champ associé à chaque colonne (null = ignorée). */
  mapping: (string | null)[];
  skipDuplicates: boolean;
  invalidPolicy: InvalidPolicy;
  report: ImportReport | null;
  resultTableId: string | null;
  set: (patch: Partial<Omit<ImportState, 'set' | 'reset'>>) => void;
  reset: () => void;
};

const initial = {
  step: 'file' as WizardStep,
  fileName: null,
  bytes: null,
  isCsv: false,
  sheets: [],
  sheet: null,
  headerRow: 0,
  target: 'new' as const,
  newTableName: '',
  tableId: null,
  columns: [],
  mapping: [],
  skipDuplicates: true,
  invalidPolicy: 'empty' as InvalidPolicy,
  report: null,
  resultTableId: null,
};

export const useImportWizard = create<ImportState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));
