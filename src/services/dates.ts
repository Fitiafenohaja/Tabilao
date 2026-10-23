// Dates stockées en texte ISO (AAAA-MM-JJ), à l'heure locale du téléphone.

const pad = (n: number) => String(n).padStart(2, '0');

export const toIsoDate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** « 2026-10-23 » → Date locale à minuit ; null si invalide. */
export function fromIsoDate(iso: string | null | undefined): Date | null {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toIsoDate(d) === iso ? d : null;
}

export const isoDaysFromToday = (days: number, now = new Date()): string => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return toIsoDate(d);
};
