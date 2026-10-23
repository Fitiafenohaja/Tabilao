import type { Field } from '@/data/schema';

import { isUnitField, type RecordData } from './fields';
import type { Value } from './formula';

const isEmpty = (v: Value | undefined) => v === null || v === undefined || v === '';

/**
 * Après le choix d'un produit (ou d'un client) déjà connu, reprend de sa dernière ligne
 * le prix et l'unité, sans écraser ce que l'utilisateur a déjà rempli.
 */
export function prefillFromPrevious(
  fields: readonly Field[],
  previous: RecordData,
  current: RecordData,
  sourceFieldId: string,
): RecordData {
  const patch: RecordData = {};
  for (const f of fields) {
    if (f.id === sourceFieldId) continue;
    const reusable = f.type === 'money' || isUnitField(f);
    if (reusable && isEmpty(current[f.id]) && !isEmpty(previous[f.id])) patch[f.id] = previous[f.id]!;
  }
  return patch;
}

/**
 * « Reprendre la dernière saisie » : mêmes valeurs, mais datée d'aujourd'hui, sans la photo
 * (un justificatif ne se réutilise pas) ; les calculs seront refaits.
 */
export function repeatValues(fields: readonly Field[], last: RecordData, today: string): RecordData {
  const out: RecordData = {};
  for (const f of fields) {
    if (f.type === 'formula' || f.type === 'photo') continue;
    if (f.type === 'date') out[f.id] = today;
    else if (!isEmpty(last[f.id])) out[f.id] = last[f.id]!;
  }
  return out;
}

/** Échappe `%` et `_` pour une recherche LIKE « contient ». */
export const likeContains = (text: string): string => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
