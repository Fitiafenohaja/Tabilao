import { decimalsOf, formatQuantity, parseQuantity, roundClean, stepQuantity } from '@/services/quantity';

const value = (input: string) => {
  const r = parseQuantity(input);
  return r.ok ? r.value : r.error;
};

describe('quantités saisies de différentes façons', () => {
  it('accepte virgule et point décimal', () => {
    expect(value('1,5')).toBe(1.5);
    expect(value('1.5')).toBe(1.5);
    expect(value('0,25')).toBe(0.25);
    expect(value(',5')).toBe(0.5);
    expect(value(' 3 ')).toBe(3);
  });

  it('accepte les espaces de milliers', () => {
    expect(value('1 000')).toBe(1000);
    expect(value('12 500,5')).toBe(12500.5);
    expect(value('1 000')).toBe(1000);
  });

  it('accepte les fractions (demi-kilo, quart…)', () => {
    expect(value('1/2')).toBe(0.5);
    expect(value('1 1/2')).toBe(1.5);
    expect(value('½')).toBe(0.5);
    expect(value('2½')).toBe(2.5);
    expect(value('3/4')).toBe(0.75);
    expect(value('1/0')).toBe('invalid');
  });

  it('refuse les unités tapées dans le champ, plutôt que de deviner', () => {
    expect(value('3 kg')).toBe('letters');
    expect(value('2,5kg')).toBe('letters');
    expect(value('1e3')).toBe('letters');
  });

  it('refuse les écritures ambiguës', () => {
    expect(value('1,5,2')).toBe('invalid');
    expect(value('1 00')).toBe('invalid');
    expect(value('1..5')).toBe('invalid');
    expect(value('')).toBe('empty');
  });

  it('garde le signe (retours, corrections de stock)', () => {
    expect(value('-2')).toBe(-2);
    expect(value('− 1,5')).toBe(-1.5);
  });

  it('compte les décimales et nettoie les calculs flottants', () => {
    expect(decimalsOf(3)).toBe(0);
    expect(decimalsOf(1.25)).toBe(2);
    expect(roundClean(0.1 + 0.2)).toBe(0.3);
  });

  it('affiche à la française avec l’unité', () => {
    expect(formatQuantity(1.5, 'kg')).toBe('1,5 kg');
    expect(formatQuantity(1000, 'pce')).toBe('1 000 pce');
    expect(formatQuantity(1 / 3, 'l')).toBe('0,333 l');
    expect(formatQuantity(2)).toBe('2');
  });

  it('avance par pas de 1 avec les boutons − / +', () => {
    expect(stepQuantity(null, 1)).toBe(1);
    expect(stepQuantity(1.5, 1)).toBe(2);
    expect(stepQuantity(1.5, -1)).toBe(1);
    expect(stepQuantity(0, -1, 0)).toBe(0);
  });
});
