import { Directory, File, Paths } from 'expo-file-system';
import { openDatabaseAsync } from 'expo-sqlite';

import { sqlite } from '@/data/db';
import { logRepo, metaRepo } from '@/data/repositories';

import { decryptBackup, encryptBackup, WrongPasswordError } from './crypto';
import { detectBackupKind } from './format';

export { passwordProblem, MIN_PASSWORD_LENGTH } from './format';

export const BACKUP_EXTENSION = '.tabilao';
export const AUTO_BACKUP_VERSIONS = 7;
export const EXTERNAL_BACKUP_REMINDER_DAYS = 7;

const backupsDir = () => {
  const dir = new Directory(Paths.document, 'backups');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
};

// Horodatage local (heure du téléphone) : AAAA-MM-JJTHH-MM-SS.
const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
};
const toPath = (uri: string) => decodeURIComponent(uri.replace(/^file:\/\//, ''));

export type BackupKind = 'manual' | 'auto' | 'pre-restore';

/** Suffixe des sauvegardes protégées par mot de passe (le contenu est de toute façon reconnu à l'en-tête). */
const PROTECTED_SUFFIX = `-enc${BACKUP_EXTENSION}`;
export const isProtectedBackup = (file: File): boolean => file.name.endsWith(PROTECTED_SUFFIX);

const vacuumInto = (file: File) => sqlite.execAsync(`VACUUM INTO '${toPath(file.uri).replace(/'/g, "''")}'`);

/**
 * Copie propre et cohérente de la base via `VACUUM INTO`, même pendant l'utilisation (WAL).
 * Avec un mot de passe, la copie est chiffrée (AES-256-GCM, clé dérivée par PBKDF2) avant d'être enregistrée :
 * c'est cette version qui peut circuler sur WhatsApp ou une carte SD.
 */
export async function createBackup(kind: BackupKind = 'manual', options: { password?: string } = {}): Promise<File> {
  const base = `tabilao-${kind}-${stamp()}`;
  let file: File;
  if (options.password) {
    const tmp = new File(Paths.cache, `${base}.db`);
    try {
      await vacuumInto(tmp);
      const encrypted = await encryptBackup(await tmp.bytes(), options.password);
      file = new File(backupsDir(), `${base}${PROTECTED_SUFFIX}`);
      file.create({ overwrite: true });
      await file.write(encrypted);
    } finally {
      if (tmp.exists) tmp.delete();
    }
  } else {
    file = new File(backupsDir(), `${base}${BACKUP_EXTENSION}`);
    await vacuumInto(file);
  }
  metaRepo.set('last_backup_at', new Date().toISOString());
  logRepo.add('backup', 'database', null, { file: file.name, kind, protected: !!options.password });
  if (kind === 'auto') pruneAutoBackups();
  return file;
}

export function listBackups(): File[] {
  return backupsDir()
    .list()
    .filter((e): e is File => e instanceof File && e.name.endsWith(BACKUP_EXTENSION))
    .sort((a, b) => b.name.localeCompare(a.name));
}

function pruneAutoBackups() {
  listBackups()
    .filter((f) => f.name.includes('-auto-'))
    .slice(AUTO_BACKUP_VERSIONS)
    .forEach((f) => f.delete());
}

/** Sauvegarde automatique quotidienne, à appeler au démarrage. */
export async function runDailyAutoBackup() {
  const last = metaRepo.get('last_backup_at');
  if (last && Date.now() - Date.parse(last) < 86_400_000) return;
  await createBackup('auto');
}

export function needsExternalBackupReminder(): boolean {
  const last = metaRepo.get('last_external_backup_at');
  return !last || Date.now() - Date.parse(last) > EXTERNAL_BACKUP_REMINDER_DAYS * 86_400_000;
}

export type BackupProblem = 'corrupted' | 'not_tabilao' | 'newer' | 'needs_password' | 'wrong_password';
export type BackupCheck = { ok: true; schemaVersion: number } | { ok: false; reason: BackupProblem };

const currentSchemaVersion = () =>
  sqlite.getFirstSync<{ n: number }>('SELECT count(*) AS n FROM __drizzle_migrations')?.n ?? 0;

/**
 * Copie en clair de la sauvegarde dans le cache (déchiffrée si besoin), pour la vérifier et l'attacher.
 * Le fichier d'origine n'est jamais modifié ; l'appelant supprime la copie.
 */
async function materialize(file: File, password?: string): Promise<{ tmp: File } | { problem: BackupProblem }> {
  const bytes = await file.bytes();
  const kind = detectBackupKind(bytes);
  if (kind === 'unknown') return { problem: 'not_tabilao' };
  if (kind === 'encrypted' && !password) return { problem: 'needs_password' };
  const tmp = new File(Paths.cache, `restore-${stamp()}.db`);
  if (kind === 'encrypted') {
    try {
      const plain = await decryptBackup(bytes, password!);
      tmp.create({ overwrite: true });
      await tmp.write(plain);
    } catch (e) {
      if (tmp.exists) tmp.delete();
      return { problem: e instanceof WrongPasswordError ? 'wrong_password' : 'corrupted' };
    }
  } else {
    await file.copy(tmp, { overwrite: true });
  }
  return { tmp };
}

/** Intégrité et version du schéma d'une copie en clair. */
async function checkPlain(tmp: File): Promise<BackupCheck> {
  try {
    const candidate = await openDatabaseAsync(tmp.name, {}, toPath(Paths.cache.uri));
    try {
      const integrity = await candidate.getFirstAsync<{ integrity_check: string }>('PRAGMA integrity_check');
      if (integrity?.integrity_check !== 'ok') return { ok: false, reason: 'corrupted' };
      const migrations = await candidate
        .getFirstAsync<{ n: number }>('SELECT count(*) AS n FROM __drizzle_migrations')
        .catch(() => null);
      if (!migrations) return { ok: false, reason: 'not_tabilao' };
      if (migrations.n > currentSchemaVersion()) return { ok: false, reason: 'newer' };
      return { ok: true, schemaVersion: migrations.n };
    } finally {
      await candidate.closeAsync();
    }
  } catch {
    return { ok: false, reason: 'corrupted' };
  }
}

/** Le fichier demande-t-il un mot de passe ? (lecture de l'en-tête, rien n'est modifié) */
export async function backupNeedsPassword(file: File): Promise<boolean> {
  return detectBackupKind(await file.bytes()) === 'encrypted';
}

/** Vérifie l'intégrité et la version du schéma d'un fichier avant restauration. Rien n'est modifié. */
export async function verifyBackup(file: File, password?: string): Promise<BackupCheck> {
  const result = await materialize(file, password);
  if ('problem' in result) return { ok: false, reason: result.problem };
  try {
    return await checkPlain(result.tmp);
  } finally {
    if (result.tmp.exists) result.tmp.delete();
  }
}

// Ordre d'insertion (parents d'abord) ; la suppression se fait dans l'ordre inverse.
// `app_meta` (langue, PIN, dates de sauvegarde) reste propre au téléphone.
const RESTORED_TABLES = ['data_tables', 'fields', 'records', 'attachments', 'rules', 'action_log'] as const;

const columnsOf = (schema: 'main' | 'bk', table: string) =>
  sqlite.getAllSync<{ name: string }>(`PRAGMA ${schema}.table_info(${table})`).map((c) => c.name);

/**
 * Restaure une sauvegarde (déchiffrée si besoin) : vérification, sauvegarde préalable de l'état courant,
 * puis remplacement des données en une seule transaction (tout ou rien).
 * La base reste ouverte : la sauvegarde est attachée (`ATTACH`) et copiée table par table.
 */
export async function restoreBackup(file: File, password?: string): Promise<BackupCheck> {
  const result = await materialize(file, password);
  if ('problem' in result) return { ok: false, reason: result.problem };
  const { tmp } = result;
  try {
    const check = await checkPlain(tmp);
    if (!check.ok) return check;

    await createBackup('pre-restore');

    sqlite.runSync('ATTACH DATABASE ? AS bk', [toPath(tmp.uri)]);
    try {
      sqlite.withTransactionSync(() => {
        for (const table of [...RESTORED_TABLES].reverse()) sqlite.execSync(`DELETE FROM main.${table}`);
        sqlite.execSync('DELETE FROM main.records_fts');
        for (const table of RESTORED_TABLES) {
          // Colonnes communes : tolère une sauvegarde d'un schéma plus ancien.
          const backupColumns = new Set(columnsOf('bk', table));
          const columns = columnsOf('main', table).filter((c) => backupColumns.has(c));
          if (columns.length === 0) continue;
          const list = columns.map((c) => `"${c}"`).join(', ');
          sqlite.execSync(`INSERT INTO main.${table} (${list}) SELECT ${list} FROM bk.${table}`);
        }
      });
    } finally {
      sqlite.execSync('DETACH DATABASE bk');
    }

    const integrity = sqlite.getFirstSync<{ integrity_check: string }>('PRAGMA integrity_check');
    logRepo.add('restore_backup', 'database', null, { file: file.name, integrity: integrity?.integrity_check });
    return check;
  } finally {
    if (tmp.exists) tmp.delete();
  }
}
