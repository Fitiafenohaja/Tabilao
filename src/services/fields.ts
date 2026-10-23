import type { Field } from '@/data/schema';

import { compile, evaluationOrder, FormulaError, type Value } from './formula';

export type FieldOptions = { choices?: string[]; currency?: string };
export type FieldValidation = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
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

  for (const name of order) {
    const field = byName.get(name)!;
    try {
      const value = compile(formulas[name]!).run({ row, column });
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
