import Papa from 'papaparse';

import type { Value } from '../formula';
import type { RecordData } from '../fields';
import type { MappedRow } from './mapper';
import type { Cell } from './types';

export type InvalidPolicy = 'empty' | 'skip';

export type ImportIssue = { line: number; field: string; value: Cell; reason: string };

export type ImportReport = {
  total: number;
  imported: number;
  skipped: number;
  corrected: number;
  issues: ImportIssue[];
};

export type ImportPlan = { rows: RecordData[]; report: ImportReport };

export type PlanOptions = {
  duplicates: ReadonlySet<number>;
  skipDuplicates: boolean;
  invalidPolicy: InvalidPolicy;
  /** Nom affiché de chaque champ, pour le rapport. */
  fieldNames: Readonly<Record<string, string>>;
  requiredFieldIds: readonly string[];
};

const isEmpty = (v: Value | undefined) => v === null || v === undefined || v === '';

/** Étapes 7 à 9 : décide ligne par ligne ce qui sera importé, ignoré ou corrigé. */
export function planImport(mapped: readonly MappedRow[], opts: PlanOptions): ImportPlan {
  const rows: RecordData[] = [];
  const issues: ImportIssue[] = [];
  let skipped = 0;
  let corrected = 0;
  const name = (id: string) => opts.fieldNames[id] ?? id;

  mapped.forEach((row, index) => {
    if (Object.values(row.data).every(isEmpty) && row.invalid.length === 0) {
      skipped++;
      return;
    }
    if (opts.skipDuplicates && opts.duplicates.has(index)) {
      skipped++;
      issues.push({ line: row.line, field: '', value: null, reason: 'Doublon ignoré' });
      return;
    }
    for (const bad of row.invalid) {
      issues.push({ line: row.line, field: name(bad.fieldId), value: bad.raw, reason: 'Valeur invalide' });
    }
    if (row.invalid.length && opts.invalidPolicy === 'skip') {
      skipped++;
      return;
    }
    const missing = opts.requiredFieldIds.filter((id) => isEmpty(row.data[id]));
    if (missing.length) {
      skipped++;
      for (const id of missing) issues.push({ line: row.line, field: name(id), value: null, reason: 'Champ obligatoire vide' });
      return;
    }
    if (row.invalid.length) corrected++;
    rows.push(row.data);
  });

  return { rows, report: { total: mapped.length, imported: rows.length, skipped, corrected, issues } };
}

/** Rapport d'erreurs exportable (CSV UTF-8, séparateur `;`). */
export function issuesToCsv(issues: readonly ImportIssue[]): string {
  return `﻿${Papa.unparse(
    { fields: ['Ligne', 'Champ', 'Valeur', 'Problème'], data: issues.map((i) => [i.line, i.field, i.value ?? '', i.reason]) },
    { delimiter: ';' },
  )}`;
}
