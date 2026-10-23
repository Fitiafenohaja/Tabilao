import { fromIsoDate, isoDaysFromToday, toIsoDate } from '@/services/dates';

describe('dates ISO locales', () => {
  it('convertit dans les deux sens', () => {
    expect(toIsoDate(new Date(2026, 9, 3))).toBe('2026-10-03');
    expect(fromIsoDate('2026-10-03')?.getDate()).toBe(3);
  });

  it('refuse les dates impossibles', () => {
    expect(fromIsoDate('2026-02-30')).toBeNull();
    expect(fromIsoDate('23/10/2026')).toBeNull();
    expect(fromIsoDate(null)).toBeNull();
  });

  it('calcule hier et aujourd’hui, y compris en changeant de mois', () => {
    const now = new Date(2026, 10, 1, 9, 30);
    expect(isoDaysFromToday(0, now)).toBe('2026-11-01');
    expect(isoDaysFromToday(-1, now)).toBe('2026-10-31');
  });
});
