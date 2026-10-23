import { eq } from 'drizzle-orm';

import { db, type Executor } from '../db';
import { appMeta } from '../schema';

export type MetaKey =
  | 'onboarding_done'
  | 'last_backup_at'
  | 'last_external_backup_at'
  | 'locale'
  | 'currency'
  | 'pin_hash'
  | 'biometric_enabled'
  | 'lock_delay'
  | 'lock_failures'
  | 'lock_until';

export const metaRepo = {
  get(key: MetaKey, ex: Executor = db): string | null {
    return ex.select().from(appMeta).where(eq(appMeta.key, key)).get()?.value ?? null;
  },

  set(key: MetaKey, value: string, ex: Executor = db) {
    ex.insert(appMeta).values({ key, value }).onConflictDoUpdate({ target: appMeta.key, set: { value } }).run();
  },

  remove(key: MetaKey, ex: Executor = db) {
    ex.delete(appMeta).where(eq(appMeta.key, key)).run();
  },
};
