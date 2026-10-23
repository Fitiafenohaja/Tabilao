import { daysBeforePurge, purgeLimit } from '@/services/trash';

const now = Date.parse('2026-10-23T12:00:00Z');

describe('corbeille', () => {
  it('compte les jours restants avant l’effacement définitif', () => {
    expect(daysBeforePurge('2026-10-23T11:00:00Z', now)).toBe(30);
    expect(daysBeforePurge('2026-10-03T12:00:00Z', now)).toBe(10);
    expect(daysBeforePurge('2026-09-01T12:00:00Z', now)).toBe(0);
  });

  it('calcule la date limite de purge', () => {
    expect(purgeLimit(now)).toBe('2026-09-23T12:00:00.000Z');
  });
});
