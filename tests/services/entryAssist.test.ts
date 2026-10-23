import { likeContains, prefillFromPrevious, repeatValues } from '@/services/entryAssist';

import { makeField } from '../helpers';

const date = makeField({ id: 'd', name: 'Date', type: 'date' });
const product = makeField({ id: 'p', name: 'Produit', type: 'text' });
const qty = makeField({ id: 'q', name: 'Quantité', type: 'number' });
const unit = makeField({ id: 'u', name: 'Unité', type: 'choice' });
const price = makeField({ id: 'pr', name: 'Prix unitaire', type: 'money' });
const total = makeField({ id: 't', name: 'Total', type: 'formula', formula: '{Quantité} * {Prix unitaire}' });
const photo = makeField({ id: 'ph', name: 'Ticket', type: 'photo' });
const fields = [date, product, qty, unit, price, total, photo];

const previous = { d: '2026-10-20', p: 'Savon Nosy', q: 3, u: 'pce', pr: 1500, t: 4500, ph: 'file:///ticket.jpg' };

describe('aide à la saisie', () => {
  it('reprend prix et unité du dernier « Savon Nosy »', () => {
    expect(prefillFromPrevious(fields, previous, { d: '2026-10-23', p: 'Savon Nosy', q: 1 }, 'p')).toEqual({ pr: 1500, u: 'pce' });
  });

  it('n’écrase pas ce que l’utilisateur a déjà tapé', () => {
    expect(prefillFromPrevious(fields, previous, { p: 'Savon Nosy', pr: 1800, u: 'kg' }, 'p')).toEqual({});
  });

  it('« Reprendre la dernière saisie » : datée d’aujourd’hui, sans photo ni calcul', () => {
    expect(repeatValues(fields, previous, '2026-10-23')).toEqual({ d: '2026-10-23', p: 'Savon Nosy', q: 3, u: 'pce', pr: 1500 });
  });

  it('échappe les jokers de recherche', () => {
    expect(likeContains('50%_sav')).toBe('%50\\%\\_sav%');
  });
});
