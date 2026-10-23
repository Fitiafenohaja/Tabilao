import { FormulaError } from './errors';
import { tokenize, type Operator, type Token } from './tokenizer';

export const MAX_DEPTH = 32;

export const FUNCTIONS = {
  SOMME: 'sum',
  SUM: 'sum',
  MOYENNE: 'avg',
  AVERAGE: 'avg',
  MIN: 'min',
  MAX: 'max',
  SI: 'if',
  IF: 'if',
} as const;

export type FunctionName = (typeof FUNCTIONS)[keyof typeof FUNCTIONS];

export type Node =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'ref'; name: string }
  | { type: 'unary'; op: '-'; operand: Node }
  | { type: 'percent'; operand: Node }
  | { type: 'binary'; op: Exclude<Operator, '%'>; left: Node; right: Node }
  | { type: 'call'; fn: FunctionName; args: Node[] };

const COMPARISON: Operator[] = ['<', '>', '<=', '>=', '=', '<>'];

/**
 * Analyseur à descente récursive. Grammaire :
 *   comparison     := additive (CMP additive)?
 *   additive       := multiplicative (('+' | '-') multiplicative)*
 *   multiplicative := unary (('*' | '/') unary)*
 *   unary          := '-' unary | postfix
 *   postfix        := primary '%'?
 *   primary        := NUMBER | STRING | REF | IDENT '(' args ')' | '(' comparison ')'
 */
export function parse(source: string): Node {
  const tokens = tokenize(source);
  let index = 0;

  const peek = (): Token => tokens[index]!;
  const next = (): Token => tokens[index++]!;
  const isOp = (t: Token, ...ops: Operator[]): t is Extract<Token, { kind: 'op' }> =>
    t.kind === 'op' && ops.includes(t.op);

  const guard = (depth: number) => {
    if (depth > MAX_DEPTH) throw new FormulaError('too_deep', 'Formule trop complexe');
  };

  function comparison(depth: number): Node {
    guard(depth);
    const left = additive(depth + 1);
    const t = peek();
    if (isOp(t, ...COMPARISON)) {
      next();
      const right = additive(depth + 1);
      return { type: 'binary', op: t.op as Exclude<Operator, '%'>, left, right };
    }
    return left;
  }

  function additive(depth: number): Node {
    guard(depth);
    let node = multiplicative(depth + 1);
    for (let t = peek(); isOp(t, '+', '-'); t = peek()) {
      next();
      node = { type: 'binary', op: t.op as '+' | '-', left: node, right: multiplicative(depth + 1) };
    }
    return node;
  }

  function multiplicative(depth: number): Node {
    guard(depth);
    let node = unary(depth + 1);
    for (let t = peek(); isOp(t, '*', '/'); t = peek()) {
      next();
      node = { type: 'binary', op: t.op as '*' | '/', left: node, right: unary(depth + 1) };
    }
    return node;
  }

  function unary(depth: number): Node {
    guard(depth);
    if (isOp(peek(), '-')) {
      next();
      return { type: 'unary', op: '-', operand: unary(depth + 1) };
    }
    if (isOp(peek(), '+')) {
      next();
      return unary(depth + 1);
    }
    const node = primary(depth + 1);
    if (isOp(peek(), '%')) {
      next();
      return { type: 'percent', operand: node };
    }
    return node;
  }

  function primary(depth: number): Node {
    guard(depth);
    const t = next();
    switch (t.kind) {
      case 'number':
        return { type: 'number', value: t.value };
      case 'string':
        return { type: 'string', value: t.value };
      case 'ref':
        return { type: 'ref', name: t.name };
      case 'lparen': {
        const inner = comparison(depth + 1);
        expect('rparen', 'Parenthèse fermante attendue');
        return inner;
      }
      case 'ident': {
        const fn = FUNCTIONS[t.name as keyof typeof FUNCTIONS];
        if (!fn) throw new FormulaError('unknown_function', `Fonction inconnue : ${t.name}`);
        expect('lparen', `Parenthèse attendue après ${t.name}`);
        const args: Node[] = [];
        if (peek().kind !== 'rparen') {
          args.push(comparison(depth + 1));
          while (peek().kind === 'sep') {
            next();
            args.push(comparison(depth + 1));
          }
        }
        expect('rparen', `Parenthèse fermante attendue pour ${t.name}`);
        if (fn === 'if' && args.length !== 3) {
          throw new FormulaError('syntax', 'SI attend 3 arguments : SI(condition; oui; non)');
        }
        if (fn !== 'if' && args.length === 0) {
          throw new FormulaError('syntax', `${t.name} attend au moins un argument`);
        }
        return { type: 'call', fn, args };
      }
      case 'eof':
        throw new FormulaError('syntax', 'Formule incomplète');
      default:
        throw new FormulaError('syntax', `Élément inattendu (position ${t.pos + 1})`);
    }
  }

  function expect(kind: Token['kind'], message: string) {
    if (next().kind !== kind) throw new FormulaError('syntax', message);
  }

  const ast = comparison(0);
  if (peek().kind !== 'eof') throw new FormulaError('syntax', `Élément inattendu (position ${peek().pos + 1})`);
  return ast;
}

/** Noms des champs référencés par une formule. */
export function collectRefs(node: Node, out = new Set<string>()): Set<string> {
  switch (node.type) {
    case 'ref':
      out.add(node.name);
      break;
    case 'unary':
    case 'percent':
      collectRefs(node.operand, out);
      break;
    case 'binary':
      collectRefs(node.left, out);
      collectRefs(node.right, out);
      break;
    case 'call':
      node.args.forEach((arg) => collectRefs(arg, out));
      break;
  }
  return out;
}
