import { recordsRepo, type RecordQuery } from '@/data/repositories';
import type { SortOption } from '@/services/sorting';
import { sumValues } from '@/services/summary';

import { useDbQuery } from '../useDbQuery';
import { periodRange, useFilters } from './filtersStore';

/** Lignes filtrées et triées, nombre total, et somme du champ montant sur tout le résultat filtré. */
export function useRecords(
  tableId: string,
  options: { dateFieldId?: string; amountFieldId?: string; sort?: Pick<SortOption, 'fieldId' | 'direction'> } = {},
) {
  const { dateFieldId, amountFieldId, sort } = options;
  const { search, period, equals } = useFilters();
  const query: RecordQuery = {
    search,
    dateFieldId,
    ...periodRange(period),
    equals: equals ?? undefined,
    sort: { fieldId: sort?.fieldId ?? undefined, direction: sort?.direction ?? 'desc' },
    limit: 200,
  };
  const key = JSON.stringify(query);
  const records = useDbQuery(() => recordsRepo.list(tableId, query), [tableId, key]);
  const total = useDbQuery(() => recordsRepo.count(tableId, query), [tableId, key]);
  const sum = useDbQuery(
    () => (amountFieldId ? sumValues(recordsRepo.columnValues(tableId, amountFieldId, query)) : null),
    [tableId, key, amountFieldId],
  );
  return { records, total, sum, query };
}
