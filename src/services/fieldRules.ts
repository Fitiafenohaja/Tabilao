import type { Field } from '@/data/schema';

import { collectRefs, findCycle, FormulaError, parse } from './formula';

/** Erreur de définition de champ, message en français clair pour l'écran. */
export class FieldDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FieldDefinitionError';
  }
}

type FieldShape = Pick<Field, 'name' | 'type' | 'formula'>;

const normalize = (name: string) => name.trim().toLocaleLowerCase('fr');

/**
 * Vérifie l'ensemble des champs d'un tableau avant écriture :
 * noms non vides et uniques, formules valides, références existantes, pas de cycle.
 */
export function assertFieldSet(all: readonly FieldShape[]) {
  const names = new Set<string>();
  for (const f of all) {
    const key = normalize(f.name);
    if (!key) throw new FieldDefinitionError('Le nom du champ est obligatoire');
    if (/[{}]/.test(f.name)) throw new FieldDefinitionError('Le nom du champ ne peut pas contenir { ou }');
    if (names.has(key)) throw new FieldDefinitionError(`Un champ « ${f.name.trim()} » existe déjà`);
    names.add(key);
  }

  const exact = new Set(all.map((f) => f.name));
  const formulas: Record<string, string> = {};
  for (const f of all) {
    if (f.type !== 'formula') continue;
    if (!f.formula?.trim()) throw new FieldDefinitionError(`Le champ « ${f.name} » n'a pas de formule`);
    let refs: Set<string>;
    try {
      refs = collectRefs(parse(f.formula));
    } catch (e) {
      throw new FieldDefinitionError(`${f.name} : ${e instanceof FormulaError ? e.message : 'formule invalide'}`);
    }
    for (const ref of refs) {
      if (!exact.has(ref)) throw new FieldDefinitionError(`${f.name} : champ introuvable {${ref}}`);
    }
    formulas[f.name] = f.formula;
  }
  const cycle = findCycle(formulas);
  if (cycle) throw new FieldDefinitionError(`Référence circulaire : ${cycle.join(' → ')}`);
}

/** Champs calculés qui référencent `name` (empêche une suppression qui casserait une formule). */
export function dependentsOf(all: readonly FieldShape[], name: string): string[] {
  return all
    .filter((f) => f.type === 'formula' && f.formula && f.name !== name)
    .filter((f) => {
      try {
        return collectRefs(parse(f.formula!)).has(name);
      } catch {
        return false;
      }
    })
    .map((f) => f.name);
}
