// Calcul guidé « [colonne] [opération] [colonne] » : ce qu'un commerçant fait 9 fois sur 10,
// construit avec des boutons, sans taper d'accolades.

export const SIMPLE_OPERATORS = ['*', '+', '-', '/'] as const;
export type SimpleOperator = (typeof SIMPLE_OPERATORS)[number];

/** Symbole affiché : × ÷ − plutôt que * / -. */
export const OPERATOR_SYMBOL: Record<SimpleOperator, string> = { '*': '×', '+': '+', '-': '−', '/': '÷' };

export type SimpleFormula = { left: string; op: SimpleOperator; right: string };

export const buildSimpleFormula = ({ left, op, right }: SimpleFormula): string => `{${left}} ${op} {${right}}`;

/** Relit une formule de la forme `{A} op {B}` ; null si elle est plus complexe (mode « écrire moi-même »). */
export function parseSimpleFormula(source: string | null | undefined): SimpleFormula | null {
  const m = source ? /^\s*\{([^{}]+)\}\s*([*+\-/×÷−])\s*\{([^{}]+)\}\s*$/.exec(source) : null;
  if (!m) return null;
  const op = ({ '×': '*', '÷': '/', '−': '-' } as Record<string, SimpleOperator>)[m[2]!] ?? (m[2] as SimpleOperator);
  return { left: m[1]!.trim(), op, right: m[3]!.trim() };
}
