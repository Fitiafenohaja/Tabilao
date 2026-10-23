import { Directory, File, Paths } from 'expo-file-system';
import { openDatabaseAsync } from 'expo-sqlite';

import { sqlite } from '@/data/db';
import { logRepo, metaRepo } from '@/data/repositories';

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

/**
 * Copie propre et cohérente de la base via `VACUUM INTO`, même pendant l'utilisation (WAL).
 * TODO v1 : compression zip et chiffrement AES-256 optionnel (mot de passe de sauvegarde).
 */
export type BackupKind = 'manual' | 'auto' | 'pre-restore';

export async function createBackup(kind: BackupKind = 'manual'): Promise<File> {
  const file = new File(backupsDir(), `tabilao-${kind}-${stamp()}${BACKUP_EXTENSION}`);
  await sqlite.execAsync(`VACUUM INTO '${toPath(file.uri).replace(/'/g, "''")}'`);
  metaRepo.set('last_backup_at', new Date().toISOString());
  logRepo.add('backup', 'database', null, { file: file.name, kind });
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

export type BackupCheck =
  | { ok: true; schemaVersion: number }
  | { ok: false; reason: 'corrupted' | 'not_tabilao' | 'newer' };

const currentSchemaVersion = () =>
  sqlite.getFirstSync<{ n: number }>('SELECT count(*) AS n FROM __drizzle_migrations')?.n ?? 0;

/** Vérifie l'intégrité et la version du schéma d'un fichier avant restauration. Rien n'est modifié. */
export async function verifyBackup(file: File): Promise<BackupCheck> {
  const tmpName = `verify-${stamp()}.db`;
  const tmp = new File(Paths.cache, tmpName);
  try {
    await file.copy(tmp, { overwrite: true });
    const candidate = await openDatabaseAsync(tmpName, {}, toPath(Paths.cache.uri));
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
  } finally {
    if (tmp.exists) tmp.delete();
  }
}

// Ordre d'insertion (parents d'abord) ; la suppression se fait dans l'ordre inverse.
// `app_meta` (langue, PIN, dates de sauvegarde) reste propre au téléphone.
const RESTORED_TABLES = ['data_tables', 'fields', 'records', 'attachments', 'rules', 'action_log'] as const;

const columnsOf = (schema: 'main' | 'bk', table: string) =>
  sqlite.getAllSync<{ name: string }>(`PRAGMA ${schema}.table_info(${table})`).map((c) => c.name);

/**
 * Restaure une sauvegarde : vérification, sauvegarde préalable de l'état courant,
 * puis remplacement des données en une seule transaction (tout ou rien).
 * La base reste ouverte : la sauvegarde est attachée (`ATTACH`) et copiée table par table.
 */
export async function restoreBackup(file: File): Promise<BackupCheck> {
  const check = await verifyBackup(file);
  if (!check.ok) return check;

  await createBackup('pre-restore');

  sqlite.runSync('ATTACH DATABASE ? AS bk', [toPath(file.uri)]);
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
}
