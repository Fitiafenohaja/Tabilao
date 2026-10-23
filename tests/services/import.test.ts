import * as XLSX from 'xlsx';

import { convertCell, decodeText, detectDelimiter, detectHeaderRow, findDuplicates, guessType, ImportError, listSheets, mapRows, readCsv, readXlsx } from '@/services/import';

const bytes = (s: string) => new TextEncoder().encode(s);

describe('import CSV', () => {
  it('détecte le séparateur', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
  });

  it('décode UTF-8 (avec BOM) et Windows-1252', () => {
    expect(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, ...bytes('Dépense')]))).toBe('Dépense');
    expect(decodeText(new Uint8Array([0x44, 0xe9, 0x70, 0x80]))).toBe('Dép€');
  });

  it('lit un fichier', () => {
    const sheet = readCsv(bytes('Produit;Quantité\nSavon;3\nRiz;\n'));
    expect(sheet.rows).toEqual([
      ['Produit', 'Quantité'],
      ['Savon', '3'],
      ['Riz', null],
    ]);
  });

  it('refuse un fichier vide', () => {
    expect(() => readCsv(bytes(''))).toThrow(ImportError);
  });
});

describe('import Excel', () => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Titre du rapport'], ['Date', 'Produit', 'Montant'], ['2026-10-23', 'Savon', 4500]]), 'Ventes');
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['x']]), 'Autre');
  const file = XLSX.write(book, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const data = new Uint8Array(file);

  it('liste les feuilles et lit les valeurs', () => {
    expect(listSheets(data)).toEqual(['Ventes', 'Autre']);
    const sheet = readXlsx(data, 'Ventes');
    expect(sheet.rows[2]).toEqual(['2026-10-23', 'Savon', 4500]);
    expect(detectHeaderRow(sheet)).toBe(1);
  });
});

describe('association colonnes → champs', () => {
  it('propose un type par colonne', () => {
    expect(guessType(['2026-10-01', '01/10/2026'])).toBe('date');
    expect(guessType(['1500', '2 000'], 'Prix unitaire')).toBe('money');
    expect(guessType(['3', '4'], 'Quantité')).toBe('number');
    expect(guessType(['oui', 'non'])).toBe('boolean');
    expect(guessType(['Savon', 'Riz'])).toBe('text');
  });

  it('convertit et signale les valeurs invalides ligne par ligne', () => {
    expect(convertCell('23/10/2026', 'date')).toBe('2026-10-23');
    expect(convertCell('eny', 'boolean')).toBe(true);
    const rows = mapRows(
      { name: 's', rows: [['Qté', 'Date'], ['3', '2026-10-23'], ['abc', 'hier']] },
      0,
      [
        { column: 0, fieldId: 'q', type: 'number' },
        { column: 1, fieldId: 'd', type: 'date' },
      ],
    );
    expect(rows[0]).toEqual({ line: 2, data: { q: 3, d: '2026-10-23' }, invalid: [] });
    expect(rows[1]!.invalid.map((i) => i.fieldId)).toEqual(['q', 'd']);
  });

  it('détecte les doublons dans le fichier et avec l’existant', () => {
    const dup = findDuplicates([{ p: 'Savon', q: 1 }, { p: 'savon ', q: 1 }, { p: 'Riz', q: 2 }], [{ p: 'Riz', q: 2 }], ['p', 'q']);
    expect([...dup]).toEqual([1, 2]);
  });
});
