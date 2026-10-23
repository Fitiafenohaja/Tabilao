import * as XLSX from 'xlsx';

import { checkRows, checkSize, ImportError, type Cell, type RawSheet } from './types';

/** Noms des feuilles, pour l'étape « Choix de la feuille ». */
export function listSheets(bytes: Uint8Array): string[] {
  checkSize(bytes.byteLength);
  try {
    return XLSX.read(bytes, { type: 'array', bookSheets: true }).SheetNames;
  } catch {
    throw new ImportError('unreadable', 'Fichier Excel illisible');
  }
}

/** Lit une feuille. Les formules Excel sont importées comme valeurs. */
export function readXlsx(bytes: Uint8Array, sheetName?: string): RawSheet {
  checkSize(bytes.byteLength);
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, { type: 'array', cellDates: true, cellFormula: false });
  } catch {
    throw new ImportError('unreadable', 'Fichier Excel illisible');
  }
  const name = sheetName ?? workbook.SheetNames[0];
  const sheet = name ? workbook.Sheets[name] : undefined;
  if (!name || !sheet) throw new ImportError('empty', 'Aucune feuille trouvée');

  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null, blankrows: false });
  const rows: Cell[][] = raw.map((r) =>
    r.map((c): Cell => {
      if (c instanceof Date) return c.toISOString().slice(0, 10);
      if (typeof c === 'string' || typeof c === 'number' || typeof c === 'boolean') return c;
      return null;
    }),
  );
  const result = { name, rows };
  checkRows(result);
  return result;
}
