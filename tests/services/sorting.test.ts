import { filterFieldOf, sortOptions } from '@/services/sorting';

import { makeField } from '../helpers';

const date = makeField({ id: 'd', name: 'Date', type: 'date' });
const product = makeField({ id: 'p', name: 'Produit', type: 'text' });
const unit = makeField({ id: 'u', name: 'Unité', type: 'choice' });
const payment = makeField({ id: 'pay', name: 'Paiement', type: 'choice' });
const total = makeField({ id: 't', name: 'Montant total', type: 'formula', formula: '{A} * {B}' });

describe('tri et filtre rapides', () => {
  it('propose date, montant et nom quand ils existent', () => {
    expect(sortOptions([date, product, total]).map((o) => o.key)).toEqual(['newest', 'oldest', 'largest', 'smallest', 'az', 'za']);
    expect(sortOptions([date, product, total])[2]).toEqual(expect.objectContaining({ fieldId: 't', direction: 'desc' }));
  });

  it('trie par date de saisie quand il n’y a pas de colonne date', () => {
    expect(sortOptions([product])[0]).toEqual(expect.objectContaining({ fieldId: null, direction: 'desc' }));
  });

  it('filtre sur une liste de choix, jamais sur « Unité »', () => {
    expect(filterFieldOf([unit, payment])?.id).toBe('pay');
    expect(filterFieldOf([unit])).toBeUndefined();
  });
});
