import { FIELD_PRESETS, missingPresets } from '@/services/fieldPresets';
import { assertFieldSet } from '@/services/fieldRules';

describe('champs courants (ajout en un geste)', () => {
  it('propose tout pour un tableau vide', () => {
    expect(missingPresets([])).toEqual(Object.keys(FIELD_PRESETS));
  });

  it('ne repropose pas un champ déjà présent, même écrit autrement', () => {
    expect(missingPresets([{ name: ' date ' }, { name: 'MONTANT' }])).not.toContain('date');
    expect(missingPresets([{ name: 'Montant' }])).not.toContain('amount');
  });

  it('forme un ensemble de champs valide', () => {
    expect(() =>
      assertFieldSet(Object.values(FIELD_PRESETS).map((p) => ({ name: p.name, type: p.type, formula: null }))),
    ).not.toThrow();
  });
});

it('compare avec le nom traduit', () => {
  const mg = (id: string) => ({ product: 'Vokatra' })[id] ?? id;
  expect(missingPresets([{ name: 'Vokatra' }], mg as never)).not.toContain('product');
});
