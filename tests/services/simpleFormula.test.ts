import { buildSimpleFormula, compile, parseSimpleFormula } from '@/services/formula';

describe('calcul guidé', () => {
  it('construit une formule valide depuis les boutons', () => {
    const f = buildSimpleFormula({ left: 'Quantité', op: '*', right: 'Prix unitaire' });
    expect(f).toBe('{Quantité} * {Prix unitaire}');
    expect(compile(f).run({ row: { Quantité: 3, 'Prix unitaire': 1500 } })).toBe(4500);
  });

  it('relit un calcul simple, y compris avec × ÷ −', () => {
    expect(parseSimpleFormula('{Montant dû} - {Remboursé}')).toEqual({ left: 'Montant dû', op: '-', right: 'Remboursé' });
    expect(parseSimpleFormula(' {A} × {B} ')).toEqual({ left: 'A', op: '*', right: 'B' });
  });

  it('laisse les calculs complexes au mode « écrire moi-même »', () => {
    expect(parseSimpleFormula('({A} + {B}) * 2')).toBeNull();
    expect(parseSimpleFormula('SI({Stock} < 5; "Bas"; "OK")')).toBeNull();
    expect(parseSimpleFormula(null)).toBeNull();
  });
});
