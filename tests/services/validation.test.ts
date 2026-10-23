import { computeRow } from '@/services/fields';
import { buildZodSchema } from '@/services/validation/buildZodSchema';

import { makeField } from '../helpers';

describe('validation générée depuis les champs', () => {
  const qty = makeField({ id: 'qty', name: 'Quantité', type: 'number', required: true, validationJson: '{"min":0}' });
  const price = makeField({ id: 'price', name: 'Prix', type: 'money', required: true });
  const pay = makeField({ id: 'pay', name: 'Paiement', type: 'choice', optionsJson: '{"choices":["Espèces","MVola"]}' });
  const date = makeField({ id: 'date', name: 'Date', type: 'date' });
  const total = makeField({ id: 'total', name: 'Total', type: 'formula', formula: '{Quantité} * {Prix}' });
  const schema = buildZodSchema([qty, price, pay, date, total]);

  it('accepte une saisie valide et convertit les montants', () => {
    const r = schema.safeParse({ qty: '3', price: '1 500', pay: 'MVola', date: '2026-10-23' });
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ qty: 3, price: 1500 });
  });

  it('signale les champs obligatoires vides', () => {
    const r = schema.safeParse({ qty: '', price: '100' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('Quantité est obligatoire');
  });

  it('applique min, liste de choix et format de date', () => {
    expect(schema.safeParse({ qty: '-1', price: '1' }).success).toBe(false);
    expect(schema.safeParse({ qty: '1', price: '1', pay: 'Chèque' }).success).toBe(false);
    expect(schema.safeParse({ qty: '1', price: '1', date: '23/10/2026' }).success).toBe(false);
  });

  it('recalcule les champs calculés (formules par nom, données par id)', () => {
    const { data, errors } = computeRow([qty, price, total], { qty: 3, price: 1500 });
    expect(data.total).toBe(4500);
    expect(errors).toEqual({});
  });

  it('remonte les erreurs de calcul sous le champ', () => {
    const ratio = makeField({ id: 'ratio', name: 'Ratio', type: 'formula', formula: '{Prix} / {Quantité}' });
    const { errors } = computeRow([qty, price, ratio], { qty: 0, price: 10 });
    expect(errors.ratio).toBe('Division par zéro');
  });
});
