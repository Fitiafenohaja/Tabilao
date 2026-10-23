import { FormulaError } from './errors';
import { collectRefs, parse, type Node } from './parser';

export type Value = number | string | boolean | null;

export type EvalContext = {
  /** Valeurs de la ligne courante, par nom de champ. */
  row: Readonly<Record<string, Value>>;
  /** Valeurs d'une colonne entière, pour SOMME({Montant}) etc. Absent : agrégats sur les arguments. */
  column?: (name: string) => Value[];
};

function toNumber(value: Value, label: string): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value === null || value === '') return 0;
  const n = Number(String(value).replace(',', '.').replace(/\s/g, ''));
  if (Number.isNaN(n)) throw new FormulaError('type', `« ${label} » n'est pas un nombre`);
  return n;
}

const truthy = (v: Value): boolean => v !== null && v !== '' && v !== 0 && v !== false;

function aggregateArgs(node: Extract<Node, { type: 'call' }>, ctx: EvalContext): number[] {
  const only = node.args[0];
  if (node.args.length === 1 && only?.type === 'ref' && ctx.column) {
    return ctx.column(only.name).map((v) => toNumber(v, only.name));
  }
  return node.args.map((arg) => toNumber(evalNode(arg, ctx), 'argument'));
}

const equals = (l: Value, r: Value): boolean =>
  l === r || (typeof l !== 'string' && typeof r !== 'string' && toNumber(l, '') === toNumber(r, ''));

function evalBinary(node: Extract<Node, { type: 'binary' }>, ctx: EvalContext): Value {
  const l = evalNode(node.left, ctx);
  const r = evalNode(node.right, ctx);
  if (node.op === '=') return equals(l, r);
  if (node.op === '<>') return !equals(l, r);

  const a = toNumber(l, 'gauche');
  const b = toNumber(r, 'droite');
  switch (node.op) {
    case '<':
      return a < b;
    case '>':
      return a > b;
    case '<=':
      return a <= b;
    case '>=':
      return a >= b;
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) throw new FormulaError('div_zero', 'Division par zéro');
      return a / b;
  }
}

function evalNode(node: Node, ctx: EvalContext): Value {
  switch (node.type) {
    case 'number':
    case 'string':
      return node.value;
    case 'ref': {
      if (!(node.name in ctx.row)) throw new FormulaError('unknown_ref', `Champ introuvable : {${node.name}}`);
      return ctx.row[node.name] ?? null;
    }
    case 'unary':
      return -toNumber(evalNode(node.operand, ctx), 'valeur');
    case 'percent':
      return toNumber(evalNode(node.operand, ctx), 'valeur') / 100;
    case 'binary':
      return evalBinary(node, ctx);
    case 'call': {
      if (node.fn === 'if') {
        const [cond, yes, no] = node.args as [Node, Node, Node];
        return truthy(evalNode(cond, ctx)) ? evalNode(yes, ctx) : evalNode(no, ctx);
      }
      const values = aggregateArgs(node, ctx);
      switch (node.fn) {
        case 'sum':
          return values.reduce((s, v) => s + v, 0);
        case 'avg':
          return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
        case 'min':
          return values.length ? Math.min(...values) : 0;
        case 'max':
          return values.length ? Math.max(...values) : 0;
      }
    }
  }
}

export function evaluate(ast: Node, ctx: EvalContext): Value {
  return evalNode(ast, ctx);
}

/** Compile une formule une fois, l'évalue ensuite à chaque frappe. */
export function compile(source: string) {
  const ast = parse(source);
  return {
    ast,
    refs: [...collectRefs(ast)],
    run: (ctx: EvalContext) => evaluate(ast, ctx),
  };
}

/**
 * Refuse les références circulaires entre champs calculés.
 * Retourne le cycle trouvé (noms de champs) ou null.
 */
export function findCycle(formulas: Readonly<Record<string, string>>): string[] | null {
  const deps = new Map<string, string[]>();
  for (const [name, source] of Object.entries(formulas)) {
    deps.set(name, [...collectRefs(parse(source))]);
  }
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];

  const visit = (name: string): string[] | null => {
    if (state.get(name) === 'done') return null;
    if (state.get(name) === 'visiting') return [...stack.slice(stack.indexOf(name)), name];
    state.set(name, 'visiting');
    stack.push(name);
    for (const dep of deps.get(name) ?? []) {
      const cycle = visit(dep);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(name, 'done');
    return null;
  };

  for (const name of deps.keys()) {
    const cycle = visit(name);
    if (cycle) return cycle;
  }
  return null;
}

/** Ordre de calcul : chaque champ calculé après ceux dont il dépend. */
export function evaluationOrder(formulas: Readonly<Record<string, string>>): string[] {
  const cycle = findCycle(formulas);
  if (cycle) throw new FormulaError('circular', `Référence circulaire : ${cycle.join(' → ')}`);
  const order: string[] = [];
  const seen = new Set<string>();
  const visit = (name: string) => {
    if (seen.has(name) || !(name in formulas)) return;
    seen.add(name);
    collectRefs(parse(formulas[name]!)).forEach(visit);
    order.push(name);
  };
  Object.keys(formulas).forEach(visit);
  return order;
}
