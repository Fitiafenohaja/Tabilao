import { amountFieldOf, isLowStock, sumValues, titleFieldOf } from '@/services/summary';

import { makeField } from '../helpers';

describe('synthèse du jour', () => {
  it('trouve le champ montant de chaque modèle', () => {
    const sales = [
      makeField({ name: 'Produit', type: 'text' }),
      makeField({ name: 'Prix unitaire', type: 'money' }),
      makeField({ id: 'mt', name: 'Montant total', type: 'formula', formula: '{Quantité} * {Prix unitaire}' }),
    ];
    expect(amountFieldOf(sales)?.id).toBe('mt');
    const expenses = [makeField({ id: 'm', name: 'Montant', type: 'money' })];
    expect(amountFieldOf(expenses)?.id).toBe('m');
    const stock = [makeField({ name: 'État', type: 'formula', formula: 'SI({Q} < 1; "Bas"; "OK")' })];
    expect(amountFieldOf(stock)).toBeUndefined();
  });

  it('additionne uniquement les nombres', () => {
    expect(sumValues([4500, '12', null, 3000.4, Number.NaN])).toBe(7500);
  });

  it('détecte le stock bas', () => {
    const fields = [
      makeField({ id: 'q', name: 'Quantité disponible', type: 'number' }),
      makeField({ id: 's', name: "Seuil d'alerte", type: 'number' }),
    ];
    expect(isLowStock(fields, { q: 2, s: 5 })).toBe(true);
    expect(isLowStock(fields, { q: 9, s: 5 })).toBe(false);
    expect(isLowStock(fields.slice(0, 1), { q: 0 })).toBe(false);
  });

  it('choisit un champ titre', () => {
    expect(titleFieldOf([makeField({ name: 'Q', type: 'number' }), makeField({ id: 't', name: 'Produit', type: 'text' })])?.id).toBe('t');
  });
});
