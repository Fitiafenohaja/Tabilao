import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import type { Field } from '@/data/schema';

import type { RecordData } from '../fields';

const NUMERIC = new Set<Field['type']>(['number', 'money', 'formula']);

function cellValue(field: Field, data: RecordData): string | number | boolean | null {
  const v = data[field.id] ?? null;
  if (field.type === 'boolean' && typeof v === 'boolean') return v ? 'Oui' : 'Non';
  return v;
}

/** CSV UTF-8 avec BOM (ouvert correctement par Excel), séparateur `;` pour les locales françaises. */
export function toCsv(fields: readonly Field[], rows: readonly RecordData[]): string {
  const csv = Papa.unparse(
    {
      fields: fields.map((f) => f.name),
      data: rows.map((r) => fields.map((f) => cellValue(f, r))),
    },
    { delimiter: ';' },
  );
  return `﻿${csv}`;
}

/** Classeur .xlsx : en-têtes, largeur de colonnes et ligne de totaux pour les colonnes numériques. */
export function toXlsx(sheetName: string, fields: readonly Field[], rows: readonly RecordData[]): Uint8Array {
  const header = fields.map((f) => f.name);
  const body = rows.map((r) => fields.map((f) => cellValue(f, r)));
  const totals = fields.map((f, i) =>
    i === 0
      ? 'Total'
      : NUMERIC.has(f.type)
        ? rows.reduce((s, r) => s + (typeof r[f.id] === 'number' ? (r[f.id] as number) : 0), 0)
        : null,
  );

  const sheet = XLSX.utils.aoa_to_sheet([header, ...body, totals]);
  sheet['!cols'] = header.map((h, i) => ({
    wch: Math.min(40, Math.max(h.length, ...body.slice(0, 200).map((r) => String(r[i] ?? '').length)) + 2),
  }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, sheetName.slice(0, 31));
  return XLSX.write(book, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}
