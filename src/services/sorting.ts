import type { Field } from '@/data/schema';

import { isUnitField } from './fields';
import { amountFieldOf, dateFieldOf, titleFieldOf } from './summary';

export type SortDirection = 'asc' | 'desc';

/** Une option de tri lisible : « Plus récentes », « Montant : plus grand d'abord », « Produit : A → Z ». */
export type SortOption = {
  key: string;
  /** null = date de saisie. */
  fieldId: string | null;
  direction: SortDirection;
  kind: 'newest' | 'oldest' | 'largest' | 'smallest' | 'az' | 'za';
  fieldName?: string;
};

/** Tris utiles pour un tableau : par date, par montant, par nom (s'ils existent). */
export function sortOptions(fields: readonly Field[]): SortOption[] {
  const date = dateFieldOf(fields);
  const amount = amountFieldOf(fields);
  const title = titleFieldOf(fields);
  const options: SortOption[] = [
    { key: 'newest', fieldId: date?.id ?? null, direction: 'desc', kind: 'newest' },
    { key: 'oldest', fieldId: date?.id ?? null, direction: 'asc', kind: 'oldest' },
  ];
  if (amount) {
    options.push(
      { key: 'largest', fieldId: amount.id, direction: 'desc', kind: 'largest', fieldName: amount.name },
      { key: 'smallest', fieldId: amount.id, direction: 'asc', kind: 'smallest', fieldName: amount.name },
    );
  }
  if (title) {
    options.push(
      { key: 'az', fieldId: title.id, direction: 'asc', kind: 'az', fieldName: title.name },
      { key: 'za', fieldId: title.id, direction: 'desc', kind: 'za', fieldName: title.name },
    );
  }
  return options;
}

/** Colonne « liste de choix » proposée comme filtre rapide (Paiement, Catégorie…), hors « Unité ». */
export const filterFieldOf = (fields: readonly Field[]): Field | undefined =>
  fields.find((f) => f.type === 'choice' && !isUnitField(f));
