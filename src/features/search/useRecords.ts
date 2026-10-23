import { recordsRepo } from '@/data/repositories';
import { sumValues } from '@/services/summary';

import { useDbQuery } from '../useDbQuery';
import { periodRange, useFilters } from './filtersStore';

/** Lignes filtrées, nombre total, et somme du champ montant sur tout le résultat filtré. */
export function useRecords(tableId: string, dateFieldId?: string, amountFieldId?: string) {
  const { search, period, sortDirection } = useFilters();
  const query = { search, dateFieldId, ...periodRange(period), sort: { direction: sortDirection }, limit: 200 };
  const key = JSON.stringify(query);
  const records = useDbQuery(() => recordsRepo.list(tableId, query), [tableId, key]);
  const total = useDbQuery(() => recordsRepo.count(tableId, query), [tableId, key]);
  const sum = useDbQuery(
    () => (amountFieldId ? sumValues(recordsRepo.columnValues(tableId, amountFieldId, query)) : null),
    [tableId, key, amountFieldId],
  );
  return { records, total, sum, query };
}
