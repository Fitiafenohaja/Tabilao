// Quantités : une seule règle de lecture et d'affichage pour la saisie, l'import et les listes.
// Les commerçants écrivent « 1,5 », « 1.5 », « 1 000 », « 1/2 » ou « ½ » : tout doit être compris.

/** Unités courantes au marché et en boutique à Madagascar. `short` est affiché après le nombre. */
export const UNITS = [
  { id: 'piece', short: 'pce' },
  { id: 'kg', short: 'kg' },
  { id: 'g', short: 'g' },
  { id: 'l', short: 'l' },
  { id: 'kapoaka', short: 'kapoaka' },
  { id: 'sachet', short: 'sachet' },
  { id: 'paquet', short: 'paquet' },
  { id: 'bouteille', short: 'bouteille' },
  { id: 'carton', short: 'carton' },
  { id: 'sac', short: 'sac' },
  { id: 'daba', short: 'daba' },
] as const;

/** Nombre de décimales autorisées par défaut (kg, litres…). 0 = nombres entiers seulement. */
export const DEFAULT_DECIMALS = 3;

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

export type QuantityError = 'empty' | 'letters' | 'invalid';

export type ParsedQuantity = { ok: true; value: number } | { ok: false; error: QuantityError };

/**
 * Lit une quantité saisie : virgule ou point décimal, espaces de milliers,
 * fractions « 1/2 », « 1 1/2 », « ½ », « 2½ ». Refuse les lettres (« 3 kg ») plutôt que de deviner.
 */
export function parseQuantity(input: string | number): ParsedQuantity {
  if (typeof input === 'number') return Number.isFinite(input) ? { ok: true, value: input } : { ok: false, error: 'invalid' };
  let s = input.trim().replace(/[  ]/g, ' ');
  if (!s) return { ok: false, error: 'empty' };
  if (/[a-zA-ZÀ-ÿ]/.test(s)) return { ok: false, error: 'letters' };

  const negative = /^[-−]/.test(s);
  if (negative) s = s.replace(/^[-−]\s*/, '');

  // « 2½ » ou « 2 ½ »
  const unicode = /^(\d+)?\s*([½¼¾⅓⅔])$/.exec(s);
  if (unicode) return signed(Number(unicode[1] ?? 0) + FRACTIONS[unicode[2]!]!, negative);

  // « 1/2 » ou « 1 1/2 »
  const fraction = /^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (fraction) {
    const den = Number(fraction[3]);
    if (den === 0) return { ok: false, error: 'invalid' };
    return signed(Number(fraction[1] ?? 0) + Number(fraction[2]) / den, negative);
  }

  // Espaces de milliers « 1 000 » puis une seule virgule ou un seul point décimal.
  if (!/^\d{1,3}(?: \d{3})*(?:[.,]\d+)?$|^\d+(?:[.,]\d+)?$|^[.,]\d+$/.test(s)) return { ok: false, error: 'invalid' };
  return signed(Number(s.replace(/ /g, '').replace(',', '.')), negative);
}

const signed = (value: number, negative: boolean): ParsedQuantity => ({ ok: true, value: negative ? -value : value });

/** Nombre de décimales réellement utilisées (1,25 → 2). */
export function decimalsOf(value: number): number {
  if (Number.isInteger(value)) return 0;
  const text = String(roundClean(value));
  return text.includes('e-') ? 10 : (text.split('.')[1]?.length ?? 0);
}

/** Supprime le bruit des calculs flottants (0,1 + 0,2 = 0,30000000000000004). */
export const roundClean = (value: number): number => Math.round(value * 1e9) / 1e9;

export const roundTo = (value: number, decimals: number): number => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};

/** « 1,5 kg », « 1 000 pce », « 0,333 l ». */
export function formatQuantity(value: number, unit?: string | null, decimals = DEFAULT_DECIMALS): string {
  const text = roundTo(value, decimals)
    .toLocaleString('fr-FR', { maximumFractionDigits: decimals })
    .replace(/[  ]/g, ' ');
  return unit ? `${text} ${unit}` : text;
}

/** Valeur suivante pour les boutons − / + (pas de 1, sans descendre sous `min`). */
export function stepQuantity(current: number | null, direction: 1 | -1, min?: number): number {
  const base = current ?? 0;
  const next = roundClean(direction === 1 ? Math.floor(base) + 1 : Math.ceil(base) - 1);
  return min !== undefined ? Math.max(min, next) : next;
}
