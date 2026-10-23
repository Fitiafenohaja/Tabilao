import Papa from 'papaparse';

import { checkRows, checkSize, ImportError, type Cell, type RawSheet } from './types';

/**
 * Décode un CSV en UTF-8, ou en Windows-1252 si l'UTF-8 est invalide
 * (fichiers enregistrés par Excel en français).
 */
export function decodeText(bytes: Uint8Array): string {
  const hasBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const body = hasBom ? bytes.subarray(3) : bytes;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(body);
  } catch {
    return decodeWindows1252(body);
  }
}

// Plage 0x80–0x9F de Windows-1252 ; le reste coïncide avec Latin-1.
// Décodage manuel : Hermes ne fournit que l'UTF-8 dans TextDecoder.
const CP1252_HIGH = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ';

function decodeWindows1252(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b >= 0x80 && b <= 0x9f ? CP1252_HIGH[b - 0x80] : String.fromCharCode(b);
  return out;
}

/** Séparateur `;` ou `,` : celui qui donne le plus de colonnes stables sur les premières lignes. */
export function detectDelimiter(text: string): ',' | ';' {
  const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 10);
  const count = (sep: string) => lines.map((l) => l.split(sep).length - 1);
  const semi = count(';');
  const comma = count(',');
  const score = (c: number[]) => (c.every((n) => n === c[0]) ? 2 : 1) * (c[0] ?? 0);
  return score(semi) >= score(comma) && (semi[0] ?? 0) > 0 ? ';' : ',';
}

export function readCsv(bytes: Uint8Array, name = 'CSV'): RawSheet {
  checkSize(bytes.byteLength);
  const text = decodeText(bytes);
  const parsed = Papa.parse<string[]>(text, { delimiter: detectDelimiter(text), skipEmptyLines: 'greedy' });
  if (parsed.errors.length && parsed.data.length === 0) {
    throw new ImportError('unreadable', 'Fichier CSV illisible');
  }
  const rows: Cell[][] = parsed.data.map((r) => r.map((c) => (c === '' ? null : c)));
  const sheet = { name, rows };
  checkRows(sheet);
  return sheet;
}
