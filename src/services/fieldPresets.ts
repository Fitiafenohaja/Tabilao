import type { Field } from '@/data/schema';
import type { TemplateField } from '@/templates';

/** Champs courants, ajoutables en un geste dans l'éditeur. */
export const FIELD_PRESETS = {
  date: { name: 'Date', type: 'date', required: true, defaultValue: '@today' },
  product: { name: 'Produit', type: 'text', required: true },
  client: { name: 'Client', type: 'text' },
  quantity: { name: 'Quantité', type: 'number', defaultValue: '1', validation: { min: 0 } },
  amount: { name: 'Montant', type: 'money', required: true, validation: { min: 0 } },
  payment: {
    name: 'Paiement',
    type: 'choice',
    defaultValue: 'Espèces',
    options: { choices: ['Espèces', 'MVola', 'Orange Money', 'Airtel Money', 'Crédit'] },
  },
  comment: { name: 'Commentaire', type: 'text' },
} as const satisfies Record<string, TemplateField>;

export type FieldPresetId = keyof typeof FIELD_PRESETS;

/**
 * Préréglages pas encore présents dans le tableau (comparaison par nom, sans casse).
 * `nameOf` donne le nom dans la langue de l'utilisateur ; par défaut, le nom français.
 */
export function missingPresets(
  fields: readonly Pick<Field, 'name'>[],
  nameOf: (id: FieldPresetId) => string = (id) => FIELD_PRESETS[id].name,
): FieldPresetId[] {
  const names = new Set(fields.map((f) => f.name.trim().toLocaleLowerCase('fr')));
  return (Object.keys(FIELD_PRESETS) as FieldPresetId[]).filter(
    (id) => !names.has(nameOf(id).trim().toLocaleLowerCase('fr')),
  );
}
