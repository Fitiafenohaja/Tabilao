import type { Field } from '@/data/schema';

import type { RecordData } from './fields';
import type { Value } from './formula';

const AMOUNT_NAME = /montant|total|solde|vola|amount|balance/i;

/**
 * Champ « montant » d'un tableau, pour les totaux : d'abord un champ calculé ou monétaire
 * nommé comme un montant, sinon le dernier champ calculé numérique, sinon le premier champ monétaire.
 */
export function amountFieldOf(fields: readonly Field[]): Field | undefined {
  const numeric = fields.filter((f) => f.type === 'money' || (f.type === 'formula' && !/"/.test(f.formula ?? '')));
  return (
    numeric.find((f) => AMOUNT_NAME.test(f.name)) ??
    [...numeric].reverse().find((f) => f.type === 'formula') ??
    numeric.find((f) => f.type === 'money')
  );
}

export const dateFieldOf = (fields: readonly Field[]): Field | undefined => fields.find((f) => f.type === 'date');

/** Premier champ texte : sert de titre à une ligne dans les listes. */
export const titleFieldOf = (fields: readonly Field[]): Field | undefined =>
  fields.find((f) => f.type === 'text') ?? fields.find((f) => f.type === 'choice');

export const sumValues = (values: readonly Value[]): number =>
  Math.round(values.reduce<number>((s, v) => s + (typeof v === 'number' && Number.isFinite(v) ? v : 0), 0));

const QTY = /quantit|stock|isa|qty/i;
const THRESHOLD = /seuil|alerte|minimum|threshold/i;

/** Ligne de stock sous son seuil d'alerte (champs « Quantité… » et « Seuil… »). */
export function isLowStock(fields: readonly Field[], data: RecordData): boolean {
  const numbers = fields.filter((f) => f.type === 'number');
  const threshold = numbers.find((f) => THRESHOLD.test(f.name));
  const qty = numbers.find((f) => f !== threshold && QTY.test(f.name));
  if (!qty || !threshold) return false;
  const q = data[qty.id];
  const t = data[threshold.id];
  return typeof q === 'number' && typeof t === 'number' && q <= t;
}
