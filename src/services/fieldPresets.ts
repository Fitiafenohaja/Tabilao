import type { Field } from '@/data/schema';
import type { TemplateField } from '@/templates';

// Colonnes courantes : proposées cochées à la création d'un tableau, et ajoutables en un geste dans l'éditeur.
// Les noms sont traduits par l'appelant (`nameOf`) ; les noms français servent par défaut.

const UNITS = ['pce', 'kg', 'l', 'kapoaka', 'sachet', 'paquet', 'bouteille', 'carton', 'sac'];
const PAYMENTS = ['Espèces', 'MVola', 'Orange Money', 'Airtel Money', 'Crédit'];

export const FIELD_PRESETS = {
  date: { name: 'Date', type: 'date', required: true, defaultValue: '@today' },
  product: { name: 'Produit', type: 'text', required: true },
  description: { name: 'Description', type: 'text' },
  client: { name: 'Client', type: 'text' },
  quantity: { name: 'Quantité', type: 'number', defaultValue: '1', validation: { min: 0 } },
  unit: { name: 'Unité', type: 'choice', defaultValue: 'pce', options: { choices: UNITS } },
  price: { name: 'Prix unitaire', type: 'money', required: true, validation: { min: 0 } },
  total: { name: 'Montant total', type: 'formula' },
  amount: { name: 'Montant', type: 'money', required: true, validation: { min: 0 } },
  threshold: { name: "Seuil d'alerte", type: 'number', defaultValue: '5', validation: { min: 0 } },
  payment: { name: 'Paiement', type: 'choice', defaultValue: 'Espèces', options: { choices: PAYMENTS } },
  comment: { name: 'Commentaire', type: 'text' },
} as const satisfies Record<string, TemplateField>;

export type FieldPresetId = keyof typeof FIELD_PRESETS;
export type NameOf = (id: FieldPresetId) => string;

const frenchName: NameOf = (id) => FIELD_PRESETS[id].name;

/** Colonnes nécessaires à une autre : le total a besoin de la quantité et du prix. */
export const PRESET_DEPENDENCIES: Partial<Record<FieldPresetId, readonly FieldPresetId[]>> = {
  total: ['quantity', 'price'],
};

/** Calcul automatique d'une colonne préréglée, écrit avec les noms traduits. */
export function presetFormula(id: FieldPresetId, nameOf: NameOf = frenchName): string | null {
  return id === 'total' ? `{${nameOf('quantity')}} * {${nameOf('price')}}` : null;
}

/** Définition complète d'une colonne préréglée, prête à être créée. */
export function presetColumn(id: FieldPresetId, nameOf: NameOf = frenchName): TemplateField {
  const preset: TemplateField = FIELD_PRESETS[id];
  return { ...preset, name: nameOf(id).trim(), formula: presetFormula(id, nameOf) ?? undefined };
}

export type TableCategory = 'income' | 'expense' | 'stock' | 'other';

/** Colonnes proposées selon ce que suit le tableau ; `checked` = cochée d'office. */
export const SUGGESTIONS: Record<TableCategory, readonly { id: FieldPresetId; checked: boolean }[]> = {
  income: [
    { id: 'date', checked: true },
    { id: 'product', checked: true },
    { id: 'quantity', checked: true },
    { id: 'unit', checked: false },
    { id: 'price', checked: true },
    { id: 'total', checked: true },
    { id: 'payment', checked: true },
    { id: 'client', checked: false },
    { id: 'comment', checked: false },
  ],
  expense: [
    { id: 'date', checked: true },
    { id: 'description', checked: true },
    { id: 'amount', checked: true },
    { id: 'payment', checked: true },
    { id: 'comment', checked: false },
  ],
  stock: [
    { id: 'product', checked: true },
    { id: 'quantity', checked: true },
    { id: 'unit', checked: false },
    { id: 'threshold', checked: true },
    { id: 'price', checked: false },
    { id: 'comment', checked: false },
  ],
  other: [
    { id: 'date', checked: true },
    { id: 'description', checked: true },
    { id: 'amount', checked: false },
    { id: 'comment', checked: false },
  ],
};

export const defaultSelection = (category: TableCategory): Set<FieldPresetId> =>
  new Set(SUGGESTIONS[category].filter((s) => s.checked).map((s) => s.id));

/**
 * Coche ou décoche une colonne en gardant la cohérence :
 * cocher le total coche quantité et prix ; décocher l'une d'elles décoche le total.
 */
export function toggleColumn(selected: ReadonlySet<FieldPresetId>, id: FieldPresetId): Set<FieldPresetId> {
  const next = new Set(selected);
  if (next.has(id)) {
    next.delete(id);
    for (const [dependent, deps] of Object.entries(PRESET_DEPENDENCIES)) {
      if (deps?.includes(id)) next.delete(dependent as FieldPresetId);
    }
  } else {
    next.add(id);
    for (const dep of PRESET_DEPENDENCIES[id] ?? []) next.add(dep);
  }
  return next;
}

/** Colonnes cochées, dans l'ordre proposé (un calcul vient toujours après ce dont il dépend). */
export function selectedColumns(category: TableCategory, selected: ReadonlySet<FieldPresetId>, nameOf: NameOf = frenchName) {
  return SUGGESTIONS[category].filter((s) => selected.has(s.id)).map((s) => presetColumn(s.id, nameOf));
}

/**
 * Colonnes courantes pas encore présentes dans un tableau (comparaison par nom, sans casse).
 * Le total n'est proposé que si la quantité et le prix existent déjà.
 */
export function missingPresets(fields: readonly Pick<Field, 'name'>[], nameOf: NameOf = frenchName): FieldPresetId[] {
  const names = new Set(fields.map((f) => f.name.trim().toLocaleLowerCase('fr')));
  const has = (id: FieldPresetId) => names.has(nameOf(id).trim().toLocaleLowerCase('fr'));
  return (Object.keys(FIELD_PRESETS) as FieldPresetId[]).filter(
    (id) => !has(id) && (PRESET_DEPENDENCIES[id] ?? []).every(has),
  );
}
