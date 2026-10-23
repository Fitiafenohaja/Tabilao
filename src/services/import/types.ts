export const IMPORT_LIMITS = { maxBytes: 10 * 1024 * 1024, maxRows: 20_000, previewRows: 20 } as const;

export type Cell = string | number | boolean | null;

/** Feuille brute lue depuis un fichier, avant association aux champs. */
export type RawSheet = { name: string; rows: Cell[][] };

export type ImportErrorCode = 'too_large' | 'too_many_rows' | 'empty' | 'unreadable';

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

export function checkSize(bytes: number) {
  if (bytes > IMPORT_LIMITS.maxBytes) throw new ImportError('too_large', 'Fichier trop volumineux (10 Mo maximum)');
}

export function checkRows(sheet: RawSheet) {
  if (sheet.rows.length === 0) throw new ImportError('empty', `La feuille « ${sheet.name} » est vide`);
  if (sheet.rows.length > IMPORT_LIMITS.maxRows + 1) {
    throw new ImportError('too_many_rows', 'Trop de lignes (20 000 maximum)');
  }
}
