import type { Value } from '../formula';
import type { RecordData } from '../fields';

/**
 * Règle entre tableaux (cahier des charges §12.1), stockée dans `rules.action_json`.
 * Exemple : une vente de 3 savons diminue de 3 la quantité du produit dans Stock.
 */
export type RuleAction = {
  kind: 'adjust';
  /** Champ « Référence » du tableau source qui pointe vers la ligne cible. */
  sourceRefFieldId: string;
  /** Champ numérique du tableau source (quantité vendue). */
  sourceAmountFieldId: string;
  /** Champ numérique de la ligne cible à ajuster (quantité disponible). */
  targetFieldId: string;
  operation: 'decrement' | 'increment';
};

export type RuleEffect = { targetRecordId: string; targetFieldId: string; delta: number };

/** Calcule l'effet d'une règle sur un enregistrement source. Pure : l'écriture est faite par le repository, dans la même transaction. */
export function ruleEffect(action: RuleAction, source: RecordData): RuleEffect | null {
  const target = source[action.sourceRefFieldId];
  const amount = source[action.sourceAmountFieldId];
  if (typeof target !== 'string' || !target || typeof amount !== 'number' || amount === 0) return null;
  return {
    targetRecordId: target,
    targetFieldId: action.targetFieldId,
    delta: action.operation === 'decrement' ? -amount : amount,
  };
}

export function applyEffect(target: RecordData, effect: RuleEffect): RecordData {
  const current: Value = target[effect.targetFieldId] ?? 0;
  const base = typeof current === 'number' ? current : Number(current) || 0;
  return { ...target, [effect.targetFieldId]: base + effect.delta };
}

/** Effet inverse, pour annuler une règle quand l'enregistrement source est supprimé ou modifié. */
export const invertEffect = (effect: RuleEffect): RuleEffect => ({ ...effect, delta: -effect.delta });

export function parseRuleAction(json: string): RuleAction | null {
  try {
    const value = JSON.parse(json) as Partial<RuleAction>;
    return value.kind === 'adjust' ? (value as RuleAction) : null;
  } catch {
    return null;
  }
}
