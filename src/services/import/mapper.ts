import type { FieldType } from '@/data/schema';

import type { Value } from '../formula';
import { parseAmount } from '../money';
import { parseQuantity } from '../quantity';
import type { Cell, RawSheet } from './types';

/** Ligne d'en-tête probable : la première dont toutes les cellules non vides sont du texte. */
export function detectHeaderRow(sheet: RawSheet, scan = 10): number {
  for (let i = 0; i < Math.min(scan, sheet.rows.length); i++) {
    const cells = sheet.rows[i]!.filter((c) => c !== null && c !== '');
    if (cells.length >= 2 && cells.every((c) => typeof c === 'string' && Number.isNaN(Number(c)))) return i;
  }
  return 0;
}

const DATE_RE = /^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})$/;
const BOOL_VALUES = new Set(['oui', 'non', 'yes', 'no', 'eny', 'tsia', 'true', 'false', 'vrai', 'faux']);

/** Type proposé pour une colonne, d'après un échantillon de valeurs. */
export function guessType(values: readonly Cell[], header = ''): FieldType {
  const sample = values.filter((v) => v !== null && v !== '').slice(0, 50);
  if (sample.length === 0) return 'text';
  const strings = sample.map((v) => String(v).trim());

  if (strings.every((s) => DATE_RE.test(s))) return 'date';
  if (strings.every((s) => BOOL_VALUES.has(s.toLowerCase()))) return 'boolean';
  if (strings.every((s) => parseAmount(s) !== null)) {
    return /prix|montant|total|co[uû]t|vidiny|ariary|\bar\b/i.test(header) ? 'money' : 'number';
  }
  const distinct = new Set(strings);
  if (sample.length >= 10 && distinct.size <= 8) return 'choice';
  return 'text';
}

/** Convertit une cellule vers le type du champ. `undefined` = valeur invalide. */
export function convertCell(cell: Cell, type: FieldType): Value | undefined {
  if (cell === null || cell === '') return null;
  const s = String(cell).trim();
  switch (type) {
    case 'number': {
      const parsed = parseQuantity(typeof cell === 'number' ? cell : s);
      return parsed.ok ? parsed.value : undefined;
    }
    case 'money':
      return typeof cell === 'number' ? Math.round(cell) : (parseAmount(s) ?? undefined);
    case 'date': {
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
      return m ? `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}` : undefined;
    }
    case 'boolean': {
      const v = s.toLowerCase();
      if (['oui', 'yes', 'eny', 'true', 'vrai', '1'].includes(v)) return true;
      if (['non', 'no', 'tsia', 'false', 'faux', '0'].includes(v)) return false;
      return undefined;
    }
    default:
      return s;
  }
}

export type ColumnMapping = { column: number; fieldId: string; type: FieldType };

export type MappedRow = { line: number; data: Record<string, Value>; invalid: { fieldId: string; raw: Cell }[] };

/** Applique l'association colonnes → champs et signale les valeurs invalides, ligne par ligne. */
export function mapRows(sheet: RawSheet, headerRow: number, mapping: readonly ColumnMapping[]): MappedRow[] {
  return sheet.rows.slice(headerRow + 1).map((row, i) => {
    const data: Record<string, Value> = {};
    const invalid: MappedRow['invalid'] = [];
    for (const m of mapping) {
      const raw = row[m.column] ?? null;
      const value = convertCell(raw, m.type);
      if (value === undefined) invalid.push({ fieldId: m.fieldId, raw });
      else data[m.fieldId] = value;
    }
    return { line: headerRow + i + 2, data, invalid };
  });
}

/** Noms de colonnes utilisables comme noms de champs : non vides, sans accolades, uniques. */
export function headerNames(sheet: RawSheet, headerRow: number): string[] {
  const header = sheet.rows[headerRow] ?? [];
  const width = Math.max(header.length, ...sheet.rows.slice(headerRow, headerRow + 50).map((r) => r.length));
  const used = new Set<string>();
  return Array.from({ length: width }, (_, i) => {
    const base = String(header[i] ?? '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim() || `Colonne ${i + 1}`;
    let name = base;
    for (let n = 2; used.has(name.toLocaleLowerCase('fr')); n++) name = `${base} (${n})`;
    used.add(name.toLocaleLowerCase('fr'));
    return name;
  });
}
