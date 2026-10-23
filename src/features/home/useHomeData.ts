import { fieldsRepo, recordsRepo, tablesRepo, type TableSummary } from '@/data/repositories';
import { amountFieldOf, dateFieldOf, isLowStock, sumValues } from '@/services/summary';
import { todayIso } from '@/services/tables';

import { useDbQuery } from '../useDbQuery';

export type TableCardData = TableSummary & { todayTotal: number | null; lowStock: number };

export type HomeData = { tables: TableCardData[]; income: number; expenses: number };

/** Synthèse de l'accueil : totaux du jour par catégorie, stock bas, résumé de chaque tableau. */
export function useHomeData(): HomeData {
  return useDbQuery(() => {
    const today = todayIso();
    let income = 0;
    let expenses = 0;
    const tables = tablesRepo.list().map((table): TableCardData => {
      const fields = fieldsRepo.list(table.id);
      let todayTotal: number | null = null;
      if (table.category === 'income' || table.category === 'expense') {
        const amount = amountFieldOf(fields);
        if (amount) {
          todayTotal = sumValues(
            recordsRepo.columnValues(table.id, amount.id, { dateFieldId: dateFieldOf(fields)?.id, from: today, to: today }),
          );
          if (table.category === 'income') income += todayTotal;
          else expenses += todayTotal;
        }
      }
      const lowStock =
        table.category === 'stock' ? recordsRepo.allData(table.id).filter((d) => isLowStock(fields, d)).length : 0;
      return { ...table, todayTotal, lowStock };
    });
    return { tables, income, expenses };
  }, []);
}
