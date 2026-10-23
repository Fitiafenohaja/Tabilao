import { breakdown, frequentEntries, percent, withChoice } from '@/services/insights';

import { makeField } from '../helpers';

describe('où va mon argent', () => {
  it('regroupe, trie et calcule les parts', () => {
    const items = breakdown([
      { key: 'Transport', amount: 20_000 },
      { key: 'Marchandises', amount: 150_000 },
      { key: 'Transport', amount: 10_000 },
      { key: null, amount: 20_000 },
    ]);
    expect(items.map((i) => [i.label, i.amount])).toEqual([
      ['Marchandises', 150_000],
      ['Transport', 30_000],
      ['Sans catégorie', 20_000],
    ]);
    expect(percent(items[0]!.share)).toBe(75);
  });

  it('réunit les petites catégories dans « Autres »', () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((key, i) => ({ key, amount: 100 - i }));
    const items = breakdown(rows, 5);
    expect(items).toHaveLength(6);
    expect(items.at(-1)).toEqual(expect.objectContaining({ label: 'Autres', amount: 95 + 94, other: true }));
  });

  it('ignore les montants vides ou négatifs, et n’affiche jamais 0 %', () => {
    expect(breakdown([{ key: 'X', amount: 0 }, { key: 'Y', amount: Number.NaN }])).toEqual([]);
    expect(percent(0.001)).toBe(1);
  });
});

describe('saisies habituelles', () => {
  const cat = makeField({ id: 'c', name: 'Catégorie', type: 'choice' });
  const amount = makeField({ id: 'm', name: 'Montant', type: 'money' });
  const date = makeField({ id: 'd', name: 'Date', type: 'date' });
  const fields = [date, cat, amount];

  it('repère les opérations qui reviennent, quelle que soit la date', () => {
    const recent = [
      { d: '2026-10-01', c: 'Loyer', m: 150_000 },
      { d: '2026-09-01', c: 'Loyer', m: 150_000 },
      { d: '2026-10-20', c: 'Transport', m: 2_000 },
      { d: '2026-10-21', c: 'transport ', m: 2_000 },
      { d: '2026-10-22', c: 'Transport', m: 2_000 },
      { d: '2026-10-22', c: 'Électricité', m: 35_000 },
    ];
    expect(frequentEntries(fields, recent).map((r) => r.c)).toEqual(['Transport', 'Loyer']);
  });
});

describe('ajouter une catégorie depuis la saisie', () => {
  it('ajoute avant « Autre », sans doublon', () => {
    expect(withChoice(['Transport', 'Autre'], ' crédit  téléphone ')).toEqual({ choices: ['Transport', 'crédit téléphone', 'Autre'], value: 'crédit téléphone' });
    expect(withChoice(['Transport'], 'transport')).toEqual({ choices: ['Transport'], value: 'Transport' });
    expect(withChoice(['Transport'], '  ').value).toBe('');
  });
});
