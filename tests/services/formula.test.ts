import { compile, evaluationOrder, findCycle, FormulaError, parse, MAX_DEPTH } from '@/services/formula';

const run = (src: string, row: Record<string, number | string | null> = {}, column?: (n: string) => number[]) =>
  compile(src).run({ row, column });

describe('moteur de formules', () => {
  it('respecte la priorité des opérateurs et les parenthèses', () => {
    expect(run('2 + 3 * 4')).toBe(14);
    expect(run('(2 + 3) * 4')).toBe(20);
    expect(run('-2 * 3')).toBe(-6);
    expect(run('10 / 4')).toBe(2.5);
  });

  it('accepte les symboles × ÷ −', () => {
    expect(run('6 × 2 ÷ 3 − 1')).toBe(3);
  });

  it('évalue les références de champs', () => {
    expect(run('{Quantité} * {Prix unitaire}', { Quantité: 3, 'Prix unitaire': 1500 })).toBe(4500);
    expect(run('({Prix} - {Remise}) * {Quantité}', { Prix: 1000, Remise: 100, Quantité: 2 })).toBe(1800);
  });

  it('traite les champs vides comme 0', () => {
    expect(run('{A} + 1', { A: null })).toBe(1);
  });

  it('calcule un pourcentage simple', () => {
    expect(run('{Prix} * 20%', { Prix: 5000 })).toBe(1000);
  });

  it('gère SI avec ; ou ,', () => {
    expect(run('SI({Stock} < {Seuil}; "Alerte"; "OK")', { Stock: 2, Seuil: 5 })).toBe('Alerte');
    expect(run('IF({Stock} < {Seuil}, "Alerte", "OK")', { Stock: 9, Seuil: 5 })).toBe('OK');
    expect(run('SI({Statut} = "Payé"; 1; 0)', { Statut: 'Payé' })).toBe(1);
  });

  it('agrège sur les arguments ou sur la colonne', () => {
    expect(run('SOMME(1; 2; 3)')).toBe(6);
    expect(run('MOYENNE(2; 4)')).toBe(3);
    expect(run('MIN(5; 2; 9)')).toBe(2);
    expect(run('MAX(5; 2; 9)')).toBe(9);
    expect(run('SOMME({Montant})', { Montant: 0 }, () => [100, 200, 300])).toBe(600);
  });

  it('refuse la division par zéro', () => {
    expect(() => run('{A} / {B}', { A: 1, B: 0 })).toThrow(expect.objectContaining({ code: 'div_zero' }));
  });

  it('refuse le code arbitraire et les fonctions inconnues', () => {
    expect(() => parse('alert(1)')).toThrow(FormulaError);
    expect(() => parse('{A}; DROP TABLE')).toThrow(FormulaError);
    expect(() => parse('constructor.constructor("x")()')).toThrow(FormulaError);
    expect(() => parse('`x`')).toThrow(FormulaError);
  });

  it('signale les erreurs de syntaxe', () => {
    expect(() => parse('(1 + 2')).toThrow(FormulaError);
    expect(() => parse('1 +')).toThrow(FormulaError);
    expect(() => parse('{A')).toThrow(FormulaError);
    expect(() => parse('SI(1; 2)')).toThrow(FormulaError);
  });

  it('signale une référence inconnue', () => {
    expect(() => run('{Inconnu} + 1')).toThrow(expect.objectContaining({ code: 'unknown_ref' }));
  });

  it(`limite la profondeur à ${MAX_DEPTH}`, () => {
    expect(() => parse('('.repeat(40) + '1' + ')'.repeat(40))).toThrow(expect.objectContaining({ code: 'too_deep' }));
  });

  it('détecte les références circulaires', () => {
    expect(findCycle({ A: '{B} + 1', B: '{A} * 2' })).toEqual(['A', 'B', 'A']);
    expect(findCycle({ A: '{A}' })).toEqual(['A', 'A']);
    expect(findCycle({ Total: '{Qté} * {Prix}', TVA: '{Total} * 20%' })).toBeNull();
  });

  it('ordonne le calcul selon les dépendances', () => {
    expect(evaluationOrder({ TTC: '{HT} + {TVA}', TVA: '{HT} * 20%', HT: '{Qté} * {Prix}' })).toEqual(['HT', 'TVA', 'TTC']);
    expect(() => evaluationOrder({ A: '{B}', B: '{A}' })).toThrow(expect.objectContaining({ code: 'circular' }));
  });
});
