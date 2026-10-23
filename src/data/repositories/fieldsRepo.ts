import { asc, eq } from 'drizzle-orm';

import { assertFieldSet } from '@/services/fieldRules';
import { renameRef } from '@/services/formula';

import { db, type Executor } from '../db';
import { newId } from '../ids';
import { fields, type Field, type NewField } from '../schema';

export type FieldInput = Omit<NewField, 'id' | 'tableId'>;

export const fieldsRepo = {
  list(tableId: string, ex: Executor = db): Field[] {
    return ex.select().from(fields).where(eq(fields.tableId, tableId)).orderBy(asc(fields.position)).all();
  },

  get(id: string, ex: Executor = db): Field | undefined {
    return ex.select().from(fields).where(eq(fields.id, id)).get();
  },

  create(tableId: string, input: FieldInput, ex: Executor = db): Field {
    const existing = this.list(tableId, ex);
    const row = { position: existing.length, ...input, id: newId(), tableId };
    assertFieldSet([...existing, { name: row.name, type: row.type, formula: row.formula ?? null }]);
    ex.insert(fields).values(row).run();
    return ex.select().from(fields).where(eq(fields.id, row.id)).get()!;
  },

  /** Met à jour un champ ; un renommage est répercuté dans les formules des autres champs. */
  update(id: string, patch: Partial<FieldInput>, ex: Executor = db) {
    const current = ex.select().from(fields).where(eq(fields.id, id)).get();
    if (!current) return;
    const renamed = patch.name !== undefined && patch.name !== current.name ? patch.name : null;
    const next = this.list(current.tableId, ex).map((f) => {
      if (f.id === id) return { ...f, ...patch };
      if (renamed && f.type === 'formula' && f.formula) return { ...f, formula: renameRef(f.formula, current.name, renamed) };
      return f;
    });
    assertFieldSet(next);
    ex.update(fields).set(patch).where(eq(fields.id, id)).run();
    if (renamed) {
      for (const f of next) {
        if (f.id !== id && f.type === 'formula') ex.update(fields).set({ formula: f.formula }).where(eq(fields.id, f.id)).run();
      }
    }
  },

  reorder(orderedIds: readonly string[], ex: Executor = db) {
    orderedIds.forEach((id, position) => ex.update(fields).set({ position }).where(eq(fields.id, id)).run());
  },

  remove(id: string, ex: Executor = db) {
    ex.delete(fields).where(eq(fields.id, id)).run();
  },
};
