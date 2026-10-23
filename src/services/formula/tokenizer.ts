import { FormulaError } from './errors';

export type Token =
  | { kind: 'number'; value: number; pos: number }
  | { kind: 'string'; value: string; pos: number }
  | { kind: 'ref'; name: string; pos: number }
  | { kind: 'ident'; name: string; pos: number }
  | { kind: 'op'; op: Operator; pos: number }
  | { kind: 'lparen' | 'rparen' | 'sep' | 'eof'; pos: number };

export type Operator = '+' | '-' | '*' | '/' | '%' | '<' | '>' | '<=' | '>=' | '=' | '<>';

const OP_ALIASES: Record<string, Operator> = { '×': '*', '÷': '/', '−': '-', '≤': '<=', '≥': '>=', '≠': '<>' };

// Lettres latines accentuées, sans × (U+00D7) ni ÷ (U+00F7) qui sont des opérateurs.
const IDENT_START = /[A-Za-zÀ-ÖØ-öø-ÿ_]/;
const IDENT = /^[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ_0-9.]*/;

/** Découpe une formule. Références : `{Nom du champ}`. Séparateur d'arguments : `;` ou `,`. */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i]!;

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(source[i + 1] ?? ''))) {
      const match = /^[0-9]*\.?[0-9]+|^[0-9]+/.exec(source.slice(i))!;
      tokens.push({ kind: 'number', value: Number(match[0]), pos: i });
      i += match[0].length;
      continue;
    }

    if (ch === '{') {
      const end = source.indexOf('}', i);
      if (end === -1) throw new FormulaError('syntax', `Accolade non fermée (position ${i + 1})`);
      const name = source.slice(i + 1, end).trim();
      if (!name) throw new FormulaError('syntax', `Référence vide (position ${i + 1})`);
      tokens.push({ kind: 'ref', name, pos: i });
      i = end + 1;
      continue;
    }

    if (ch === '"') {
      const end = source.indexOf('"', i + 1);
      if (end === -1) throw new FormulaError('syntax', `Guillemet non fermé (position ${i + 1})`);
      tokens.push({ kind: 'string', value: source.slice(i + 1, end), pos: i });
      i = end + 1;
      continue;
    }

    if (IDENT_START.test(ch)) {
      const match = IDENT.exec(source.slice(i))!;
      tokens.push({ kind: 'ident', name: match[0].toUpperCase(), pos: i });
      i += match[0].length;
      continue;
    }

    const two = source.slice(i, i + 2);
    if (two === '<=' || two === '>=' || two === '<>') {
      tokens.push({ kind: 'op', op: two, pos: i });
      i += 2;
      continue;
    }

    if ('+-*/%<>='.includes(ch)) {
      tokens.push({ kind: 'op', op: ch as Operator, pos: i });
      i++;
      continue;
    }
    if (OP_ALIASES[ch]) {
      tokens.push({ kind: 'op', op: OP_ALIASES[ch], pos: i });
      i++;
      continue;
    }

    if (ch === '(') tokens.push({ kind: 'lparen', pos: i });
    else if (ch === ')') tokens.push({ kind: 'rparen', pos: i });
    else if (ch === ';' || ch === ',') tokens.push({ kind: 'sep', pos: i });
    else throw new FormulaError('syntax', `Caractère non autorisé « ${ch} » (position ${i + 1})`);
    i++;
  }

  tokens.push({ kind: 'eof', pos: source.length });
  return tokens;
}
