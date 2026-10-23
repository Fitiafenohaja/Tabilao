import type { Field } from '@/data/schema';

import { collectRefs, compile, evaluationOrder, FormulaError, parse, type Value } from './formula';
import { parseQuantity, roundClean } from './quantity';

export type FieldOptions = {
  choices?: string[];
  currency?: string;
  /** Unité affichée après une quantité : « kg », « kapoaka »… */
  unit?: string;
};
export type FieldValidation = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  /** Décimales autorisées pour un nombre ; 0 = entiers seulement (pièces). Absent : 3. */
  decimals?: number;
};

/** Valeurs d'un enregistrement : { [fieldId]: valeur }. */
export type RecordData = Record<string, Value>;

function parseJson<T>(raw: string | null): T {
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

export const fieldOptions = (field: Pick<Field, 'optionsJson'>): FieldOptions => parseJson(field.optionsJson);
export const fieldValidation = (field: Pick<Field, 'validationJson'>): FieldValidation =>
  parseJson(field.validationJson);

export type ComputeResult = { data: RecordData; errors: Record<string, string> };

/**
 * Recalcule les champs calculés d'une ligne.
 * Les formules référencent les champs par nom ; les données sont indexées par id.
 */
export function computeRow(
  fields: readonly Field[],
  data: RecordData,
  column?: (fieldName: string) => Value[],
): ComputeResult {
  const byName = new Map(fields.map((f) => [f.name, f]));
  const formulas = Object.fromEntries(
    fields.filter((f) => f.type === 'formula' && f.formula).map((f) => [f.name, f.formula!]),
  );
  const row: Record<string, Value> = {};
  for (const f of fields) row[f.name] = data[f.id] ?? null;

  const result: RecordData = { ...data };
  const errors: Record<string, string> = {};

  let order: string[];
  try {
    order = evaluationOrder(formulas);
  } catch (e) {
    const message = e instanceof FormulaError ? e.message : 'Formule invalide';
    for (const name of Object.keys(formulas)) errors[byName.get(name)!.id] = message;
    return { data: result, errors };
  }

  // Un calcul qui dépend d'un montant donne un montant : arrondi à l'ariary (entiers, pas de REAL pour l'argent).
  const moneyNames = new Set(fields.filter((f) => f.type === 'money').map((f) => f.name));

  for (const name of order) {
    const field = byName.get(name)!;
    try {
      const refs = collectRefs(parse(formulas[name]!));
      const isMoney = [...refs].some((r) => moneyNames.has(r));
      if (isMoney) moneyNames.add(name);
      const raw = compile(formulas[name]!).run({ row, column });
      const value = typeof raw === 'number' ? (isMoney ? Math.round(raw) : roundClean(raw)) : raw;
      row[name] = value;
      result[field.id] = value;
    } catch (e) {
      row[name] = null;
      result[field.id] = null;
      errors[field.id] = e instanceof FormulaError ? e.message : 'Erreur de calcul';
    }
  }
  return { data: result, errors };
}

const UNIT_FIELD = /^(unit[ée]?|unité|unite|refy)$/i;

/** Champ « Unité » (liste de choix) : l'unité est choisie ligne par ligne. */
export const isUnitField = (field: Pick<Field, 'type' | 'name'>): boolean =>
  field.type === 'choice' && UNIT_FIELD.test(field.name.trim());

/**
 * Unité d'une quantité : celle du champ (« kg ») ou, à défaut, la valeur du champ « Unité »
 * de la même ligne (ventes de produits vendus au kilo, à la pièce, au kapoaka…).
 */
export function unitFor(field: Field, fields: readonly Field[], data: RecordData): string | null {
  const own = fieldOptions(field).unit;
  if (own) return own;
  const sibling = fields.find((f) => f.id !== field.id && isUnitField(f));
  const value = sibling ? data[sibling.id] : null;
  return typeof value === 'string' && value ? value : null;
}

/** Pendant la saisie, « 1,5 » ou « 1/2 » restent du texte : on les convertit pour le calcul en direct. */
export function normalizeNumbers(fields: readonly Field[], data: RecordData): RecordData {
  const out: RecordData = { ...data };
  for (const f of fields) {
    const v = data[f.id];
    if (f.type !== 'number' || typeof v !== 'string') continue;
    const parsed = parseQuantity(v);
    out[f.id] = parsed.ok ? parsed.value : null;
  }
  return out;
}
