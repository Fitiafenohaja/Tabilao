import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, sql, type SQL } from 'drizzle-orm';

import type { Value } from '@/services/formula';
import { likeContains } from '@/services/entryAssist';
import { purgeLimit } from '@/services/trash';
import type { RecordData } from '@/services/fields';
import { applyEffect, invertEffect, parseRuleAction, ruleEffect, type RuleEffect } from '@/services/rules';

import { db, type Executor } from '../db';
import { newId, nowIso } from '../ids';
import { records, rules, type RecordRow } from '../schema';
import { logRepo } from './logRepo';

export { TRASH_RETENTION_DAYS } from '@/services/trash';

export type RecordItem = Omit<RecordRow, 'dataJson'> & { data: RecordData };

export type RecordQuery = {
  search?: string;
  /** Filtre de période sur un champ date (ISO), ou sur created_at si absent. */
  dateFieldId?: string;
  from?: string;
  to?: string;
  equals?: { fieldId: string; value: string };
  sort?: { fieldId?: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
};

const jsonPath = (fieldId: string) => `$."${fieldId}"`;
const fieldExpr = (fieldId: string) => sql`json_extract(${records.dataJson}, ${jsonPath(fieldId)})`;

const toItem = ({ dataJson, ...row }: RecordRow): RecordItem => ({ ...row, data: JSON.parse(dataJson) as RecordData });

/** Requête FTS5 tolérante : chaque mot en préfixe, guillemets échappés. */
const ftsQuery = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `"${w.replace(/"/g, '""')}"*`)
    .join(' ');

function whereFor(tableId: string, q: RecordQuery): SQL {
  const conditions: SQL[] = [eq(records.tableId, tableId), isNull(records.deletedAt)];
  const dateExpr = q.dateFieldId ? fieldExpr(q.dateFieldId) : sql`substr(${records.createdAt}, 1, 10)`;
  if (q.from) conditions.push(gte(dateExpr, q.from));
  if (q.to) conditions.push(lte(dateExpr, q.to));
  if (q.equals) conditions.push(eq(fieldExpr(q.equals.fieldId), q.equals.value));
  if (q.search?.trim()) {
    conditions.push(
      sql`${records.id} IN (SELECT record_id FROM records_fts WHERE records_fts MATCH ${ftsQuery(q.search)} AND table_id = ${tableId})`,
    );
  }
  return and(...conditions)!;
}

/** Applique les règles du tableau source dans la transaction en cours. */
function applyRules(ex: Executor, tableId: string, data: RecordData, invert = false) {
  const active = ex
    .select()
    .from(rules)
    .where(and(eq(rules.sourceTableId, tableId), eq(rules.enabled, true)))
    .all();
  for (const rule of active) {
    const action = parseRuleAction(rule.actionJson);
    const effect: RuleEffect | null = action ? ruleEffect(action, data) : null;
    if (!effect) continue;
    const target = ex.select().from(records).where(eq(records.id, effect.targetRecordId)).get();
    if (!target) continue;
    const next = applyEffect(JSON.parse(target.dataJson) as RecordData, invert ? invertEffect(effect) : effect);
    ex.update(records)
      .set({ dataJson: JSON.stringify(next), updatedAt: nowIso() })
      .where(eq(records.id, target.id))
      .run();
  }
}

export const recordsRepo = {
  list(tableId: string, q: RecordQuery = {}, ex: Executor = db): RecordItem[] {
    const order = q.sort?.fieldId ? fieldExpr(q.sort.fieldId) : records.createdAt;
    return ex
      .select()
      .from(records)
      .where(whereFor(tableId, q))
      .orderBy(q.sort?.direction === 'asc' ? asc(order) : desc(order))
      .limit(q.limit ?? 50)
      .offset(q.offset ?? 0)
      .all()
      .map(toItem);
  },

  count(tableId: string, q: RecordQuery = {}, ex: Executor = db): number {
    return ex.select({ n: sql<number>`count(*)` }).from(records).where(whereFor(tableId, q)).get()?.n ?? 0;
  },

  get(id: string, ex: Executor = db): RecordItem | undefined {
    const row = ex.select().from(records).where(eq(records.id, id)).get();
    return row ? toItem(row) : undefined;
  },

  /** Valeurs d'une colonne, pour SOMME({…}) et les totaux en pied de liste. */
  columnValues(tableId: string, fieldId: string, q: RecordQuery = {}, ex: Executor = db): Value[] {
    return ex
      .select({ v: sql<Value>`${fieldExpr(fieldId)}` })
      .from(records)
      .where(whereFor(tableId, q))
      .all()
      .map((r) => r.v);
  },

  /**
   * Somme d'une colonne montant, regroupée par une autre colonne (ex. dépenses par catégorie),
   * calculée par SQLite. Sans colonne de regroupement, une seule somme (clé null).
   */
  sumGrouped(
    tableId: string,
    amountFieldId: string,
    groupFieldId: string | null,
    q: RecordQuery = {},
    ex: Executor = db,
  ): { key: string | null; total: number }[] {
    const amount = fieldExpr(amountFieldId);
    const key = groupFieldId ? fieldExpr(groupFieldId) : sql`NULL`;
    return ex
      .select({ key: sql<string | null>`${key}`, total: sql<number>`coalesce(sum(${amount}), 0)` })
      .from(records)
      .where(whereFor(tableId, q))
      .groupBy(key)
      .all();
  },

  /**
   * Autocomplétion : valeurs déjà saisies qui contiennent le texte (sans casse), les plus fréquentes d'abord.
   * Texte vide : les valeurs les plus fréquentes.
   */
  suggestions(tableId: string, fieldId: string, text: string, limit = 6, ex: Executor = db): string[] {
    const expr = fieldExpr(fieldId);
    const conditions: SQL[] = [eq(records.tableId, tableId), isNull(records.deletedAt), sql`${expr} IS NOT NULL AND ${expr} <> ''`];
    if (text.trim()) conditions.push(sql`${expr} LIKE ${likeContains(text.trim())} ESCAPE '\\'`);
    return ex
      .select({ v: sql<string>`${expr}` })
      .from(records)
      .where(and(...conditions))
      .groupBy(expr)
      .orderBy(sql`count(*) DESC`, sql`max(${records.createdAt}) DESC`)
      .limit(limit)
      .all()
      .map((r) => r.v);
  },

  /** Dernière ligne où une colonne vaut exactement `value` (ex. le dernier « Savon Nosy » vendu). */
  lastWhere(tableId: string, fieldId: string, value: string, ex: Executor = db): RecordItem | undefined {
    return this.list(tableId, { equals: { fieldId, value }, limit: 1 }, ex)[0];
  },

  /** Dernière ligne saisie, pour le préremplissage. */
  last(tableId: string, ex: Executor = db): RecordItem | undefined {
    return this.list(tableId, { limit: 1 }, ex)[0];
  },

  /** Insertion + règles entre tableaux, dans une seule transaction. */
  insert(tableId: string, data: RecordData): RecordItem {
    const id = newId();
    db.transaction((tx) => {
      tx.insert(records).values({ id, tableId, dataJson: JSON.stringify(data) }).run();
      applyRules(tx, tableId, data);
    });
    return this.get(id)!;
  },

  update(id: string, data: RecordData) {
    db.transaction((tx) => {
      const current = this.get(id, tx);
      if (!current) return;
      applyRules(tx, current.tableId, current.data, true);
      tx.update(records)
        .set({ dataJson: JSON.stringify(data), updatedAt: nowIso() })
        .where(eq(records.id, id))
        .run();
      applyRules(tx, current.tableId, data);
      logRepo.add('update', 'record', id, undefined, tx);
    });
  },

  /** Suppression logique : la ligne part à la corbeille (30 jours). */
  softDelete(ids: readonly string[]) {
    db.transaction((tx) => {
      for (const item of tx.select().from(records).where(inArray(records.id, [...ids])).all().map(toItem)) {
        applyRules(tx, item.tableId, item.data, true);
      }
      tx.update(records).set({ deletedAt: nowIso() }).where(inArray(records.id, [...ids])).run();
      logRepo.add('delete', 'record', null, { ids }, tx);
    });
  },

  restore(ids: readonly string[]) {
    db.transaction((tx) => {
      for (const item of tx.select().from(records).where(inArray(records.id, [...ids])).all().map(toItem)) {
        applyRules(tx, item.tableId, item.data);
      }
      tx.update(records).set({ deletedAt: null }).where(inArray(records.id, [...ids])).run();
      logRepo.add('restore', 'record', null, { ids }, tx);
    });
  },

  trashCount(tableId: string, ex: Executor = db): number {
    return (
      ex
        .select({ n: sql<number>`count(*)` })
        .from(records)
        .where(and(eq(records.tableId, tableId), isNotNull(records.deletedAt)))
        .get()?.n ?? 0
    );
  },

  trash(tableId: string, ex: Executor = db): RecordItem[] {
    return ex
      .select()
      .from(records)
      .where(and(eq(records.tableId, tableId), isNotNull(records.deletedAt)))
      .orderBy(desc(records.deletedAt))
      .all()
      .map(toItem);
  },

  /** Vide la corbeille au-delà de la durée de rétention. */
  purgeTrash(ex: Executor = db) {
    ex.delete(records).where(and(isNotNull(records.deletedAt), lt(records.deletedAt, purgeLimit()))).run();
  },

  /** Données de toutes les lignes actives (détection des doublons à l'import). */
  allData(tableId: string, ex: Executor = db): RecordData[] {
    return ex
      .select({ dataJson: records.dataJson })
      .from(records)
      .where(and(eq(records.tableId, tableId), isNull(records.deletedAt)))
      .all()
      .map((r) => JSON.parse(r.dataJson) as RecordData);
  },

  /** Insertion en lots. Hors transaction fournie, ouvre la sienne : tout réussit ou rien ne change. */
  insertMany(tableId: string, rows: readonly RecordData[], ex?: Executor): number {
    const write = (tx: Executor) => {
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500).map((data) => ({ id: newId(), tableId, dataJson: JSON.stringify(data) }));
        if (chunk.length) tx.insert(records).values(chunk).run();
      }
      logRepo.add('import', 'table', tableId, { count: rows.length }, tx);
    };
    if (ex) write(ex);
    else db.transaction(write);
    return rows.length;
  },
};
