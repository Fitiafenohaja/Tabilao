// Corbeille : une ligne supprimée reste restaurable pendant 30 jours, puis elle est effacée au démarrage.

export const TRASH_RETENTION_DAYS = 30;
const DAY = 86_400_000;

/** Jours restants avant l'effacement définitif (0 = effacée au prochain démarrage). */
export function daysBeforePurge(deletedAt: string, now = Date.now(), retentionDays = TRASH_RETENTION_DAYS): number {
  const deleted = Date.parse(deletedAt);
  if (Number.isNaN(deleted)) return retentionDays;
  return Math.max(0, Math.ceil((deleted + retentionDays * DAY - now) / DAY));
}

/** Date limite au-delà de laquelle les lignes de la corbeille sont effacées. */
export const purgeLimit = (now = Date.now(), retentionDays = TRASH_RETENTION_DAYS): string =>
  new Date(now - retentionDays * DAY).toISOString();
