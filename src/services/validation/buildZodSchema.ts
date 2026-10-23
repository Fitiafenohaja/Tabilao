import { z } from 'zod';

import type { Field } from '@/data/schema';

import { fieldOptions, fieldValidation } from '../fields';
import { parseAmount } from '../money';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);

function schemaFor(field: Field): z.ZodType {
  const rules = fieldValidation(field);
  const label = field.name;

  switch (field.type) {
    case 'number': {
      let s = z.coerce.number({ message: `${label} : nombre attendu` });
      if (rules.min !== undefined) s = s.min(rules.min, `${label} : minimum ${rules.min}`);
      if (rules.max !== undefined) s = s.max(rules.max, `${label} : maximum ${rules.max}`);
      return s;
    }
    case 'money': {
      let s = z.number({ message: `${label} : montant invalide` }).int();
      if (rules.min !== undefined) s = s.min(rules.min, `${label} : minimum ${rules.min}`);
      if (rules.max !== undefined) s = s.max(rules.max, `${label} : maximum ${rules.max}`);
      return z.preprocess((v) => (typeof v === 'string' ? (parseAmount(v) ?? v) : v), s);
    }
    case 'date':
      return z.string().regex(ISO_DATE, `${label} : date invalide`);
    case 'boolean':
      return z.boolean();
    case 'choice': {
      const choices = fieldOptions(field).choices ?? [];
      return choices.length
        ? z.string().refine((v) => choices.includes(v), `${label} : choix non autorisé`)
        : z.string();
    }
    case 'formula':
      // Calculé par le moteur, jamais saisi.
      return z.any();
    case 'reference':
    case 'photo':
      return z.string();
    case 'text': {
      let s = z.string().trim();
      if (rules.minLength !== undefined) s = s.min(rules.minLength, `${label} : ${rules.minLength} caractères minimum`);
      if (rules.maxLength !== undefined) s = s.max(rules.maxLength, `${label} : ${rules.maxLength} caractères maximum`);
      if (rules.pattern) s = s.regex(new RegExp(rules.pattern), `${label} : format invalide`);
      return s;
    }
  }
}

/** Schéma de validation du formulaire de saisie, généré depuis les champs du tableau. */
export function buildZodSchema(fields: readonly Field[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    const base = schemaFor(field);
    shape[field.id] =
      field.required && field.type !== 'formula'
        ? z.preprocess(
            emptyToUndefined,
            z
              .any()
              .refine((v) => v !== undefined, `${field.name} est obligatoire`)
              .pipe(base),
          )
        : z.preprocess(emptyToUndefined, base.optional());
  }
  return z.object(shape);
}
