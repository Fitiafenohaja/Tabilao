import * as XLSX from 'xlsx';

import { toCsv, toXlsx } from '@/services/export';

import { makeField } from '../helpers';

const fields = [
  makeField({ id: 'p', name: 'Produit', type: 'text' }),
  makeField({ id: 'm', name: 'Montant', type: 'money' }),
  makeField({ id: 'ok', name: 'Payé', type: 'boolean' }),
];
const rows = [
  { p: 'Savon', m: 4500, ok: true },
  { p: 'Riz; 1kg', m: 3000, ok: false },
];

describe('export', () => {
  it('produit un CSV UTF-8 avec BOM et séparateur ;', () => {
    const csv = toCsv(fields, rows);
    expect(csv.startsWith('﻿Produit;Montant;Payé')).toBe(true);
    expect(csv).toContain('"Riz; 1kg";3000;Non');
  });

  it('produit un .xlsx avec ligne de totaux', () => {
    const book = XLSX.read(toXlsx('Ventes', fields, rows), { type: 'array' });
    const data = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets.Ventes!, { header: 1 });
    expect(data[0]).toEqual(['Produit', 'Montant', 'Payé']);
    expect(data[3]).toEqual(['Total', 7500]);
  });
});
