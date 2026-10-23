import { asc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';

import { db, type Executor } from '../db';
import { newId, nowIso } from '../ids';
import { dataTables, records, type DataTable, type NewDataTable } from '../schema';
import { logRepo } from './logRepo';

export type TableSummary = DataTable & { recordCount: number };

export const tablesRepo = {
  list({ archived = false } = {}, ex: Executor = db): TableSummary[] {
    return ex
      .select({
        ...getTableColumns(dataTables),
        recordCount: sql<number>`(SELECT count(*) FROM ${records} WHERE ${records.tableId} = ${dataTables.id} AND ${records.deletedAt} IS NULL)`,
      })
      .from(dataTables)
      .where(archived ? sql`${dataTables.archivedAt} IS NOT NULL` : isNull(dataTables.archivedAt))
      .orderBy(asc(dataTables.position), asc(dataTables.createdAt))
      .all();
  },

  get(id: string, ex: Executor = db): DataTable | undefined {
    return ex.select().from(dataTables).where(eq(dataTables.id, id)).get();
  },

  create(input: Omit<NewDataTable, 'id' | 'createdAt' | 'updatedAt'>, ex: Executor = db): DataTable {
    const row = { ...input, id: newId() };
    ex.insert(dataTables).values(row).run();
    logRepo.add('create', 'table', row.id, { name: input.name }, ex);
    return this.get(row.id, ex)!;
  },

  update(id: string, patch: Partial<Pick<DataTable, 'name' | 'description' | 'category' | 'position'>>, ex: Executor = db) {
    ex.update(dataTables).set({ ...patch, updatedAt: nowIso() }).where(eq(dataTables.id, id)).run();
  },

  archive(id: string, archived = true, ex: Executor = db) {
    ex.update(dataTables)
      .set({ archivedAt: archived ? nowIso() : null, updatedAt: nowIso() })
      .where(eq(dataTables.id, id))
      .run();
  },

  /** Suppression définitive (après confirmation ; l'archivage est proposé d'abord). */
  remove(id: string, ex: Executor = db) {
    ex.delete(dataTables).where(eq(dataTables.id, id)).run();
    logRepo.add('delete', 'table', id, undefined, ex);
  },
};

