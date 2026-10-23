import { computeRow, normalizeNumbers, unitFor } from '@/services/fields';
import { convertCell } from '@/services/import';
import { buildZodSchema } from '@/services/validation/buildZodSchema';

import { makeField } from '../helpers';

const kg = makeField({ id: 'kg', name: 'Poids', type: 'number', required: true, optionsJson: '{"unit":"kg"}', validationJson: '{"min":0}' });
const pieces = makeField({ id: 'pc', name: 'Pièces', type: 'number', validationJson: '{"decimals":0,"min":0}' });
const price = makeField({ id: 'p', name: 'Prix', type: 'money', required: true });
const total = makeField({ id: 't', name: 'Total', type: 'formula', formula: '{Poids} * {Prix}' });
const ratio = makeField({ id: 'r', name: 'Ratio', type: 'formula', formula: '{Poids} / 3' });
const schema = buildZodSchema([kg, pieces, price]);

const issue = (data: Record<string, string>) => {
  const r = schema.safeParse({ p: '1000', ...data });
  return r.success ? null : r.error.issues[0]?.message;
};

describe('saisie des quantités', () => {
  it('accepte « 1,5 » comme « 1.5 », et les fractions', () => {
    expect(schema.parse({ kg: '1,5', p: '1000' }).kg).toBe(1.5);
    expect(schema.parse({ kg: '1/2', p: '1000' }).kg).toBe(0.5);
    expect(schema.parse({ kg: '1 000', p: '1000' }).kg).toBe(1000);
  });

  it('explique quoi faire quand l’unité est tapée', () => {
    expect(issue({ kg: '3 kg' })).toBe('Poids : tapez seulement le nombre (en kg)');
    expect(issue({ kg: 'beaucoup' })).toBe('Poids : tapez seulement le nombre (en kg)');
    expect(issue({ kg: '1,5,2' })).toBe('Poids : nombre attendu, par exemple 2 ou 1,5');
  });

  it('refuse les virgules pour un champ « entiers seulement »', () => {
    expect(issue({ kg: '1', pc: '2,5' })).toBe('Pièces : nombre entier attendu (pas de virgule)');
    expect(issue({ kg: '1', pc: '3' })).toBeNull();
  });

  it('limite les décimales et respecte le minimum avec l’unité', () => {
    expect(issue({ kg: '1,2345' })).toBe('Poids : 3 chiffres après la virgule au maximum');
    expect(issue({ kg: '-1' })).toBe('Poids : minimum 0 kg');
  });

  it('import : même lecture qu’à la saisie', () => {
    expect(convertCell('1,5', 'number')).toBe(1.5);
    expect(convertCell('½', 'number')).toBe(0.5);
    expect(convertCell('3 kg', 'number')).toBeUndefined();
  });
});

describe('arrondi des calculs', () => {
  it('un total en argent est arrondi à l’ariary', () => {
    expect(computeRow([kg, price, total], { kg: 1.5, p: 1333 }).data.t).toBe(2000); // 1999,5
    expect(computeRow([kg, price, total], { kg: 0.333, p: 1000 }).data.t).toBe(333);
  });

  it('un calcul sans argent garde ses décimales, sans bruit flottant', () => {
    expect(computeRow([kg, ratio], { kg: 1 }).data.r).toBe(0.333333333);
    expect(computeRow([kg, makeField({ id: 's', name: 'S', type: 'formula', formula: '{Poids} + 0.2' })], { kg: 0.1 }).data.s).toBe(0.3);
  });
});

describe('unité de la ligne', () => {
  const qty = makeField({ id: 'q', name: 'Quantité', type: 'number' });
  const unit = makeField({ id: 'u', name: 'Unité', type: 'choice', optionsJson: '{"choices":["pce","kg"]}' });

  it('prend l’unité du champ, sinon celle choisie sur la ligne', () => {
    expect(unitFor(kg, [kg, unit], { u: 'pce' })).toBe('kg');
    expect(unitFor(qty, [qty, unit], { u: 'kapoaka' })).toBe('kapoaka');
    expect(unitFor(qty, [qty], {})).toBeNull();
  });

  it('convertit les saisies en cours pour le calcul en direct', () => {
    expect(normalizeNumbers([qty, unit], { q: '1/2', u: 'kg' })).toEqual({ q: 0.5, u: 'kg' });
    expect(normalizeNumbers([qty], { q: '1,' })).toEqual({ q: null });
  });
});
