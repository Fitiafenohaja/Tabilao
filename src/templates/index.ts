import type { FieldType } from '@/data/schema';
import type { FieldOptions, FieldValidation } from '@/services/fields';

export type TemplateField = {
  name: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: string;
  options?: FieldOptions;
  validation?: FieldValidation;
  formula?: string;
};

export type Template = {
  id: 'sales' | 'expenses' | 'stock' | 'credits';
  /** Clé i18n du nom proposé. */
  nameKey: string;
  category: 'income' | 'expense' | 'stock' | 'credit';
  icon: string;
  fields: TemplateField[];
};

const PAYMENT = { choices: ['Espèces', 'MVola', 'Orange Money', 'Airtel Money', 'Crédit'] };

// Les modèles utilisent le même moteur que les tableaux personnalisés et restent modifiables.
export const TEMPLATES: readonly Template[] = [
  {
    id: 'sales',
    nameKey: 'templates.sales',
    category: 'income',
    icon: 'cart',
    fields: [
      { name: 'Date', type: 'date', required: true, defaultValue: '@today' },
      { name: 'Produit', type: 'text', required: true },
      { name: 'Quantité', type: 'number', required: true, defaultValue: '1', validation: { min: 0 } },
      { name: 'Prix unitaire', type: 'money', required: true, validation: { min: 0 } },
      { name: 'Montant total', type: 'formula', formula: '{Quantité} * {Prix unitaire}' },
      { name: 'Paiement', type: 'choice', defaultValue: 'Espèces', options: PAYMENT },
      { name: 'Commentaire', type: 'text' },
    ],
  },
  {
    id: 'expenses',
    nameKey: 'templates.expenses',
    category: 'expense',
    icon: 'wallet',
    fields: [
      { name: 'Date', type: 'date', required: true, defaultValue: '@today' },
      {
        name: 'Catégorie',
        type: 'choice',
        required: true,
        options: { choices: ['Achat marchandises', 'Transport', 'Loyer', 'Électricité', 'Salaire', 'Autre'] },
      },
      { name: 'Description', type: 'text' },
      { name: 'Montant', type: 'money', required: true, validation: { min: 0 } },
      { name: 'Paiement', type: 'choice', defaultValue: 'Espèces', options: PAYMENT },
      { name: 'Justificatif', type: 'photo' },
    ],
  },
  {
    id: 'stock',
    nameKey: 'templates.stock',
    category: 'stock',
    icon: 'box',
    fields: [
      { name: 'Référence', type: 'text' },
      { name: 'Nom', type: 'text', required: true },
      { name: 'Quantité disponible', type: 'number', required: true, defaultValue: '0' },
      { name: "Seuil d'alerte", type: 'number', defaultValue: '5' },
      { name: 'Prix unitaire', type: 'money', validation: { min: 0 } },
      { name: 'État', type: 'formula', formula: 'SI({Quantité disponible} <= {Seuil d\'alerte}; "Stock bas"; "OK")' },
      { name: 'Mise à jour', type: 'date', defaultValue: '@today' },
    ],
  },
  {
    id: 'credits',
    nameKey: 'templates.credits',
    category: 'credit',
    icon: 'book',
    fields: [
      { name: 'Date', type: 'date', required: true, defaultValue: '@today' },
      { name: 'Client', type: 'text', required: true },
      { name: 'Téléphone', type: 'text', validation: { pattern: '^[0-9 +]{0,15}$' } },
      { name: 'Montant dû', type: 'money', required: true, validation: { min: 0 } },
      { name: 'Remboursé', type: 'money', defaultValue: '0', validation: { min: 0 } },
      { name: 'Solde', type: 'formula', formula: '{Montant dû} - {Remboursé}' },
    ],
  },
];

export const getTemplate = (id: Template['id']): Template | undefined => TEMPLATES.find((t) => t.id === id);
