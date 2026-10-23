import {
  defaultSelection,
  FIELD_PRESETS,
  missingPresets,
  presetFormula,
  selectedColumns,
  SUGGESTIONS,
  toggleColumn,
  type FieldPresetId,
} from '@/services/fieldPresets';
import { assertFieldSet } from '@/services/fieldRules';

const mg = (id: FieldPresetId) => ({ quantity: 'Isa', price: 'Vidiny', total: 'Totaliny', product: 'Vokatra' } as Record<string, string>)[id] ?? FIELD_PRESETS[id].name;

describe('création d’un tableau sur mesure', () => {
  it('coche d’office les colonnes utiles à des ventes', () => {
    expect([...defaultSelection('income')]).toEqual(['date', 'product', 'quantity', 'price', 'total', 'payment']);
  });

  it('chaque proposition forme un tableau valide (calcul compris)', () => {
    for (const category of Object.keys(SUGGESTIONS) as (keyof typeof SUGGESTIONS)[]) {
      const all = new Set(SUGGESTIONS[category].map((s) => s.id));
      const columns = selectedColumns(category, all);
      expect(() => assertFieldSet(columns.map((c) => ({ name: c.name, type: c.type, formula: c.formula ?? null })))).not.toThrow();
    }
  });

  it('écrit le calcul avec les noms traduits', () => {
    expect(presetFormula('total')).toBe('{Quantité} * {Prix unitaire}');
    expect(presetFormula('total', mg)).toBe('{Isa} * {Vidiny}');
    const columns = selectedColumns('income', new Set(['quantity', 'price', 'total']), mg);
    expect(columns.map((c) => c.name)).toEqual(['Isa', 'Vidiny', 'Totaliny']);
    expect(() => assertFieldSet(columns.map((c) => ({ name: c.name, type: c.type, formula: c.formula ?? null })))).not.toThrow();
  });

  it('garde la cohérence quand on coche ou décoche', () => {
    const withTotal = toggleColumn(new Set(), 'total');
    expect([...withTotal].sort()).toEqual(['price', 'quantity', 'total']);
    expect(toggleColumn(withTotal, 'price').has('total')).toBe(false);
    expect(toggleColumn(new Set<FieldPresetId>(['date']), 'date').size).toBe(0);
  });
});

describe('ajout rapide dans l’éditeur', () => {
  it('ne repropose pas une colonne déjà présente, même écrite autrement', () => {
    expect(missingPresets([{ name: ' date ' }, { name: 'MONTANT' }])).not.toContain('date');
    expect(missingPresets([{ name: 'Montant' }])).not.toContain('amount');
  });

  it('ne propose le total que si quantité et prix existent', () => {
    expect(missingPresets([])).not.toContain('total');
    expect(missingPresets([{ name: 'Quantité' }, { name: 'Prix unitaire' }])).toContain('total');
  });

  it('compare avec les noms traduits', () => {
    expect(missingPresets([{ name: 'Vokatra' }], mg)).not.toContain('product');
  });
});
