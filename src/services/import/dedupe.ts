import type { Value } from '../formula';

const keyOf = (data: Record<string, Value>, fieldIds: readonly string[]): string =>
  JSON.stringify(fieldIds.map((id) => (typeof data[id] === 'string' ? (data[id] as string).trim().toLowerCase() : data[id] ?? null)));

/**
 * Doublons potentiels : lignes identiques sur les champs choisis,
 * dans le fichier lui-même ou avec les données existantes.
 * Retourne les index des lignes importées concernées.
 */
export function findDuplicates(
  incoming: readonly Record<string, Value>[],
  existing: readonly Record<string, Value>[],
  fieldIds: readonly string[],
): Set<number> {
  const seen = new Set(existing.map((d) => keyOf(d, fieldIds)));
  const duplicates = new Set<number>();
  incoming.forEach((data, i) => {
    const key = keyOf(data, fieldIds);
    if (seen.has(key)) duplicates.add(i);
    else seen.add(key);
  });
  return duplicates;
}
