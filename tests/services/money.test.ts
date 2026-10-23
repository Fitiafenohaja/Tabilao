import { formatAmount, formatSignedAmount, parseAmount } from '@/services/money';

describe('montants', () => {
  it('parse les saisies courantes en entiers', () => {
    expect(parseAmount('12 500')).toBe(12500);
    expect(parseAmount('12500 Ar')).toBe(12500);
    expect(parseAmount('1500,4')).toBe(1500);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });

  it('gère les devises à décimales en centimes', () => {
    expect(parseAmount('12,34', { code: 'EUR', symbol: '€', decimals: 2 })).toBe(1234);
  });

  it('formate avec un séparateur espace', () => {
    expect(formatAmount(12500)).toBe('12 500 Ar');
    expect(formatSignedAmount(245000)).toBe('+ 245 000 Ar');
    expect(formatSignedAmount(-38500)).toBe('− 38 500 Ar');
  });
});
