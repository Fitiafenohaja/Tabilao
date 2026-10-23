import { fieldsRepo, tablesRepo } from '@/data/repositories';

import { useDbQuery } from '../useDbQuery';

export const useTables = (archived = false) => useDbQuery(() => tablesRepo.list({ archived }), [archived]);

export function useTable(tableId: string) {
  const table = useDbQuery(() => tablesRepo.get(tableId), [tableId]);
  const fields = useDbQuery(() => fieldsRepo.list(tableId), [tableId]);
  return { table, fields };
}
