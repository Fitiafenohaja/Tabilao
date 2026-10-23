import { desc } from 'drizzle-orm';

import { db, type Executor } from '../db';
import { actionLog } from '../schema';

export type LogAction = 'create' | 'update' | 'delete' | 'restore' | 'import' | 'backup' | 'restore_backup' | 'error';

export const logRepo = {
  add(action: LogAction, entity: string, entityId: string | null, payload?: unknown, ex: Executor = db) {
    ex.insert(actionLog)
      .values({ action, entity, entityId, payloadJson: payload === undefined ? null : JSON.stringify(payload) })
      .run();
  },

  recent(limit = 50, ex: Executor = db) {
    return ex.select().from(actionLog).orderBy(desc(actionLog.id)).limit(limit).all();
  },
};
