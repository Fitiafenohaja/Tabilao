import { db } from '@/data/db';
import { fieldsRepo, tablesRepo } from '@/data/repositories';
import type { DataTable, Field } from '@/data/schema';
import type { Template, TemplateField } from '@/templates';

import { toIsoDate } from './dates';
import { presetColumn, type FieldPresetId, type NameOf, type TableCategory } from './fieldPresets';
import { FieldDefinitionError, dependentsOf } from './fieldRules';
import { fieldOptions, fieldValidation, type RecordData } from './fields';
import { parseAmount } from './money';

export type { TableCategory } from './fieldPresets';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function createColumns(tx: Tx, tableId: string, columns: readonly TemplateField[], offset = 0) {
  columns.forEach((f, i) =>
    fieldsRepo.create(
      tableId,
      {
        name: f.name.trim(),
        type: f.type,
        required: f.required ?? false,
        defaultValue: f.defaultValue ?? null,
        position: offset + i,
        formula: f.formula ?? null,
        optionsJson: f.options ? JSON.stringify(f.options) : null,
        validationJson: f.validation ? JSON.stringify(f.validation) : null,
      },
      tx,
    ),
  );
}

/** Crée un tableau et ses champs depuis un modèle, en une transaction. */
export function createFromTemplate(template: Template, name: string): DataTable {
  return db.transaction((tx) => {
    const table = tablesRepo.create({ name, category: template.category }, tx);
    createColumns(tx, table.id, template.fields);
    return table;
  });
}

export const todayIso = (): string => toIsoDate(new Date());

/** Valeurs initiales du formulaire : valeur par défaut, date du jour (`@today`). */
export function initialValues(fields: readonly Field[]): RecordData {
  const data: RecordData = {};
  for (const f of fields) {
    const def = f.defaultValue;
    if (def === null || f.type === 'formula') continue;
    if (def === '@today') data[f.id] = todayIso();
    else if (f.type === 'number') data[f.id] = Number(def);
    else if (f.type === 'money') data[f.id] = parseAmount(def);
    else if (f.type === 'boolean') data[f.id] = def === 'true';
    else data[f.id] = def;
  }
  return data;
}

export type FieldDraft = {
  name: string;
  type: Field['type'];
  required: boolean;
  defaultValue: string | null;
  choices: string[];
  formula: string | null;
  min: number | null;
  max: number | null;
  /** Nombre : unité affichée (kg, kapoaka…) ; null = aucune ou unité choisie ligne par ligne. */
  unit: string | null;
  /** Nombre : entiers seulement (pièces, bouteilles…). */
  integerOnly: boolean;
};

/** Brouillon éditable à partir d'un champ existant. */
export function draftFromField(field: Field): FieldDraft {
  const validation = fieldValidation(field);
  return {
    name: field.name,
    type: field.type,
    required: field.required,
    defaultValue: field.defaultValue,
    choices: fieldOptions(field).choices ?? [],
    formula: field.formula,
    min: validation.min ?? null,
    max: validation.max ?? null,
    unit: fieldOptions(field).unit ?? null,
    integerOnly: validation.decimals === 0,
  };
}

function draftToInput(draft: FieldDraft) {
  const isFormula = draft.type === 'formula';
  const numeric = draft.type === 'number' || draft.type === 'money';
  const validation = numeric
    ? Object.fromEntries(
        Object.entries({
          min: draft.min,
          max: draft.max,
          decimals: draft.type === 'number' && draft.integerOnly ? 0 : null,
        }).filter(([, v]) => v !== null),
      )
    : {};
  const unit = draft.type === 'number' ? draft.unit?.trim() || null : null;
  const choices = draft.choices.map((c) => c.trim()).filter(Boolean);
  if (draft.type === 'choice' && choices.length === 0) {
    throw new FieldDefinitionError('Ajoutez au moins un choix à la liste');
  }
  return {
    name: draft.name.trim(),
    type: draft.type,
    required: isFormula ? false : draft.required,
    defaultValue: isFormula || !draft.defaultValue?.trim() ? null : draft.defaultValue.trim(),
    formula: isFormula ? (draft.formula?.trim() ?? '') : null,
    optionsJson:
      draft.type === 'choice'
        ? JSON.stringify({ choices: [...new Set(choices)] })
        : unit
          ? JSON.stringify({ unit })
          : null,
    validationJson: Object.keys(validation).length ? JSON.stringify(validation) : null,
  };
}

/** Crée ou modifie un champ, en une transaction (le renommage met à jour les formules). */
export function saveField(tableId: string, fieldId: string | null, draft: FieldDraft): void {
  const input = draftToInput(draft);
  db.transaction((tx) => {
    if (fieldId) fieldsRepo.update(fieldId, input, tx);
    else fieldsRepo.create(tableId, input, tx);
    tablesRepo.update(tableId, {}, tx);
  });
}

/** Supprime un champ, sauf s'il est utilisé par une formule. Les valeurs restent dans data_json. */
export function deleteField(tableId: string, fieldId: string): void {
  const all = fieldsRepo.list(tableId);
  const field = all.find((f) => f.id === fieldId);
  if (!field) return;
  const users = dependentsOf(all, field.name);
  if (users.length) {
    throw new FieldDefinitionError(`« ${field.name} » est utilisé par : ${users.join(', ')}`);
  }
  fieldsRepo.remove(fieldId);
}

/** Déplace un champ d'un cran vers le haut (-1) ou le bas (+1). */
export function moveField(tableId: string, fieldId: string, direction: -1 | 1): void {
  const ids = fieldsRepo.list(tableId).map((f) => f.id);
  const from = ids.indexOf(fieldId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to]!, ids[from]!];
  db.transaction((tx) => fieldsRepo.reorder(ids, tx));
}

/**
 * Tableau sur mesure : nom, ce qu'il suit (recettes et dépenses comptent dans les totaux du jour)
 * et ses colonnes, créés en une seule transaction.
 */
export function createCustomTable(name: string, category: TableCategory, columns: readonly TemplateField[]): DataTable {
  const trimmed = name.trim();
  if (!trimmed) throw new FieldDefinitionError('Donnez un nom au tableau');
  return db.transaction((tx) => {
    const table = tablesRepo.create({ name: trimmed, category: category === 'other' ? null : category }, tx);
    createColumns(tx, table.id, columns);
    return table;
  });
}

/** Ajoute une colonne courante (nommée dans la langue de l'utilisateur) à la fin du tableau. */
export function addPresetField(tableId: string, id: FieldPresetId, nameOf?: NameOf): void {
  db.transaction((tx) => {
    createColumns(tx, tableId, [presetColumn(id, nameOf)], fieldsRepo.list(tableId, tx).length);
    tablesRepo.update(tableId, {}, tx);
  });
}
