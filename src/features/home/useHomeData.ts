import { fieldsRepo, recordsRepo, tablesRepo, type TableSummary } from '@/data/repositories';
import { amountFieldOf, dateFieldOf, isLowStock } from '@/services/summary';

import { periodRange, type Period } from '../search/filtersStore';
import { useDbQuery } from '../useDbQuery';

export type SummaryPeriod = Exclude<Period, 'all'>;

export type TableCardData = TableSummary & { periodTotal: number | null; lowStock: number };

export type HomeData = { tables: TableCardData[]; income: number; expenses: number };

/** Synthèse de l'accueil sur la période choisie : recettes, dépenses, stock bas, total de chaque tableau. */
export function useHomeData(period: SummaryPeriod = 'today'): HomeData {
  return useDbQuery(() => {
    const range = periodRange(period);
    let income = 0;
    let expenses = 0;
    const tables = tablesRepo.list().map((table): TableCardData => {
      const fields = fieldsRepo.list(table.id);
      let periodTotal: number | null = null;
      if (table.category === 'income' || table.category === 'expense') {
        const amount = amountFieldOf(fields);
        if (amount) {
          const [row] = recordsRepo.sumGrouped(table.id, amount.id, null, { dateFieldId: dateFieldOf(fields)?.id, ...range });
          periodTotal = Math.round(row?.total ?? 0);
          if (table.category === 'income') income += periodTotal;
          else expenses += periodTotal;
        }
      }
      const lowStock =
        table.category === 'stock' ? recordsRepo.allData(table.id).filter((d) => isLowStock(fields, d)).length : 0;
      return { ...table, periodTotal, lowStock };
    });
    return { tables, income, expenses };
  }, [period]);
}
