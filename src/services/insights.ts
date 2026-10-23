import type { Field } from '@/data/schema';

import type { RecordData } from './fields';
import type { Value } from './formula';

// Bilans et aide à la saisie : logique pure, sans base de données.

export type BreakdownItem = { label: string; amount: number; share: number; other?: boolean };

/**
 * Répartition des dépenses : regroupe par catégorie, trie du plus gros au plus petit,
 * garde les `top` premières et réunit le reste dans « Autres » (lisible sur un petit écran).
 */
export function breakdown(rows: readonly { key: string | null; amount: number }[], top = 5, labels = { none: 'Sans catégorie', others: 'Autres' }): BreakdownItem[] {
  const totals = new Map<string, number>();
  for (const { key, amount } of rows) {
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const label = key?.trim() || labels.none;
    totals.set(label, (totals.get(label) ?? 0) + amount);
  }
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return [];
  const head = sorted.slice(0, top).map(([label, amount]) => ({ label, amount, share: amount / total }));
  const rest = sorted.slice(top).reduce((s, [, v]) => s + v, 0);
  return rest > 0 ? [...head, { label: labels.others, amount: rest, share: rest / total, other: true }] : head;
}

/** Pourcentage arrondi, jamais « 0 % » pour un montant non nul. */
export const percent = (share: number): number => (share > 0 && share < 0.005 ? 1 : Math.round(share * 100));

const signatureOf = (fields: readonly Field[], data: RecordData): string =>
  JSON.stringify(
    fields
      .filter((f) => f.type !== 'date' && f.type !== 'photo' && f.type !== 'formula')
      .map((f) => {
        const v: Value | undefined = data[f.id];
        return typeof v === 'string' ? v.trim().toLocaleLowerCase('fr') : (v ?? null);
      }),
  );

/**
 * Saisies habituelles : opérations identiques revenues au moins `min` fois
 * (loyer, transport, même produit au même prix), les plus fréquentes d'abord.
 */
export function frequentEntries(fields: readonly Field[], recent: readonly RecordData[], limit = 4, min = 2): RecordData[] {
  const groups = new Map<string, { data: RecordData; count: number }>();
  for (const data of recent) {
    const key = signatureOf(fields, data);
    const group = groups.get(key);
    if (group) group.count++;
    else groups.set(key, { data, count: 1 });
  }
  return [...groups.values()]
    .filter((g) => g.count >= min)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((g) => g.data);
}

/** Ajoute un choix à une liste (sans doublon, casse ignorée) ; renvoie la valeur retenue. */
export function withChoice(choices: readonly string[], value: string): { choices: string[]; value: string } {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  const existing = choices.find((c) => c.toLocaleLowerCase('fr') === trimmed.toLocaleLowerCase('fr'));
  if (existing || !trimmed) return { choices: [...choices], value: existing ?? '' };
  const others = choices.findIndex((c) => /^autres?$/i.test(c.trim()));
  // « Autre » reste en dernier.
  const next = others === -1 ? [...choices, trimmed] : [...choices.slice(0, others), trimmed, ...choices.slice(others)];
  return { choices: next, value: trimmed };
}
