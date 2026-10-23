import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Field } from '@/data/schema';

import type { RecordData } from '../fields';
import { toCsv, toXlsx } from './index';

export const MIME = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

const safeName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tabilao';

/** Écrit un fichier temporaire puis ouvre la feuille de partage Android (WhatsApp, e-mail, Drive…). */
export async function shareFile(baseName: string, extension: keyof typeof MIME, content: string | Uint8Array, title?: string) {
  const file = new File(Paths.cache, `${safeName(baseName)}-${new Date().toISOString().slice(0, 10)}.${extension}`);
  file.create({ overwrite: true });
  await file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType: MIME[extension], dialogTitle: title });
}

export function exportTable(name: string, fields: readonly Field[], rows: readonly RecordData[], format: 'csv' | 'xlsx') {
  const content = format === 'csv' ? toCsv(fields, rows) : toXlsx(name, fields, rows);
  return shareFile(name, format, content, name);
}
