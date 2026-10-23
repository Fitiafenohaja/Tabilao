import { db } from '@/data/db';
import { fieldsRepo, recordsRepo, tablesRepo } from '@/data/repositories';
import type { FieldType } from '@/data/schema';

import { computeRow, type RecordData } from '../fields';

export type NewColumn = { tempId: string; name: string; type: FieldType; choices?: string[] };

export type ImportTarget =
  | { kind: 'new'; name: string; columns: readonly NewColumn[] }
  | { kind: 'existing'; tableId: string };

/**
 * Étape 10 : import en transaction unique (création du tableau et des champs comprise).
 * Pour un nouveau tableau, les lignes sont indexées par `tempId` puis réindexées par les vrais ids.
 */
export function runImport(target: ImportTarget, rows: readonly RecordData[]): string {
  return db.transaction((tx) => {
    let tableId: string;
    let data: RecordData[];

    if (target.kind === 'new') {
      tableId = tablesRepo.create({ name: target.name.trim() }, tx).id;
      const ids = new Map<string, string>();
      target.columns.forEach((c, position) => {
        const optionsJson = c.type === 'choice' ? JSON.stringify({ choices: c.choices ?? [] }) : null;
        ids.set(c.tempId, fieldsRepo.create(tableId, { name: c.name.trim(), type: c.type, position, optionsJson }, tx).id);
      });
      data = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [ids.get(k) ?? k, v])));
    } else {
      tableId = target.tableId;
      const fields = fieldsRepo.list(tableId, tx);
      data = fields.some((f) => f.type === 'formula') ? rows.map((r) => computeRow(fields, r).data) : [...rows];
    }

    recordsRepo.insertMany(tableId, data, tx);
    return tableId;
  });
}
