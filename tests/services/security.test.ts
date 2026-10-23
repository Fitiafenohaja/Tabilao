import {
  attemptsLeft,
  cooldownFor,
  isValidPin,
  isWeakPin,
  parsePinRecord,
  serializePinRecord,
  shouldRelock,
} from '@/services/security/policy';

describe('verrouillage par code', () => {
  it('accepte 4 à 6 chiffres', () => {
    expect(isValidPin('1357')).toBe(true);
    expect(isValidPin('135790')).toBe(true);
    expect(isValidPin('135')).toBe(false);
    expect(isValidPin('1357902')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('repère les codes trop simples', () => {
    expect(isWeakPin('0000')).toBe(true);
    expect(isWeakPin('1234')).toBe(true);
    expect(isWeakPin('987654')).toBe(true);
    expect(isWeakPin('1357')).toBe(false);
    expect(isWeakPin('2580')).toBe(false);
  });

  it('bloque progressivement après des erreurs', () => {
    expect([1, 4].map(cooldownFor)).toEqual([0, 0]);
    expect(cooldownFor(5)).toBe(30_000);
    expect(cooldownFor(6)).toBe(0);
    expect(cooldownFor(10)).toBe(60_000);
    expect(cooldownFor(15)).toBe(120_000);
    expect(cooldownFor(100)).toBe(15 * 60_000);
    expect(attemptsLeft(3)).toBe(2);
    expect(attemptsLeft(5)).toBe(5);
  });

  it('sérialise sans jamais stocker le code', () => {
    const raw = serializePinRecord({ length: 4, salt: 'ab12', hash: 'ff00' });
    expect(raw).toBe('v1:4:ab12:ff00');
    expect(parsePinRecord(raw)).toEqual({ length: 4, salt: 'ab12', hash: 'ff00' });
    expect(parsePinRecord('1234')).toBeNull();
    expect(parsePinRecord(null)).toBeNull();
  });

  it('reverrouille après le délai passé en arrière-plan', () => {
    expect(shouldRelock(null, 10_000, 60_000)).toBe(false);
    expect(shouldRelock(0, 59_999, 60_000)).toBe(false);
    expect(shouldRelock(0, 60_000, 60_000)).toBe(true);
  });
});
