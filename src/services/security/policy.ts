// Règles du verrouillage, sans dépendance native : testables avec Jest.

export const PIN_MIN = 4;
export const PIN_MAX = 6;
/** Erreurs autorisées avant un blocage temporaire. */
export const ATTEMPTS_PER_ROUND = 5;
const BASE_COOLDOWN_MS = 30_000;
const MAX_COOLDOWN_MS = 15 * 60_000;

export const LOCK_DELAYS = [30_000, 60_000, 300_000] as const;
export type LockDelay = (typeof LOCK_DELAYS)[number];
export const DEFAULT_LOCK_DELAY: LockDelay = 60_000;

export const isValidPin = (pin: string): boolean => new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);

/** Code trop facile à deviner : 1111, 1234, 4321… */
export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true;
  const digits = [...pin].map(Number);
  const steps = new Set(digits.slice(1).map((d, i) => d - digits[i]!));
  return steps.size === 1 && (steps.has(1) || steps.has(-1));
}

/**
 * Durée de blocage après `failures` erreurs consécutives :
 * rien avant 5, puis 30 s, 1 min, 2 min… (doublée tous les 5 échecs, 15 min au plus).
 */
export function cooldownFor(failures: number): number {
  if (failures < ATTEMPTS_PER_ROUND || failures % ATTEMPTS_PER_ROUND !== 0) return 0;
  const round = failures / ATTEMPTS_PER_ROUND - 1;
  return Math.min(BASE_COOLDOWN_MS * 2 ** round, MAX_COOLDOWN_MS);
}

export const attemptsLeft = (failures: number): number => ATTEMPTS_PER_ROUND - (failures % ATTEMPTS_PER_ROUND);

/** Enregistrement stocké dans app_meta.pin_hash : `v1:<longueur>:<sel>:<empreinte>`. Jamais le code en clair. */
export type PinRecord = { length: number; salt: string; hash: string };

export const serializePinRecord = (r: PinRecord): string => `v1:${r.length}:${r.salt}:${r.hash}`;

export function parsePinRecord(raw: string | null): PinRecord | null {
  const m = raw ? /^v1:(\d):([0-9a-f]+):([0-9a-f]+)$/.exec(raw) : null;
  return m ? { length: Number(m[1]), salt: m[2]!, hash: m[3]! } : null;
}

/** Faut-il reverrouiller au retour au premier plan ? */
export const shouldRelock = (backgroundedAt: number | null, now: number, delay: number): boolean =>
  backgroundedAt !== null && now - backgroundedAt >= delay;
