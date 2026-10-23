import { fieldsRepo, recordsRepo, tablesRepo } from '@/data/repositories';
import { breakdown, type BreakdownItem } from '@/services/insights';
import { filterFieldOf } from '@/services/sorting';
import { amountFieldOf, dateFieldOf } from '@/services/summary';

import type { SummaryPeriod } from '../home/useHomeData';
import { periodRange } from '../search/filtersStore';
import { useDbQuery } from '../useDbQuery';

/** Où mène une catégorie : le tableau de dépenses, filtré sur cette catégorie. */
export type SpendingTarget = { tableId: string; fieldId?: string; value?: string };

export type SpendingItem = BreakdownItem & { target?: SpendingTarget };

export type Spending = { total: number; items: SpendingItem[]; hasExpenseTable: boolean };

/**
 * « Où va mon argent ? » : dépenses de la période, par catégorie (colonne « liste de choix »
 * du tableau, ex. Catégorie), tous tableaux de dépenses confondus.
 */
export function useSpending(period: SummaryPeriod, labels: { none: string; others: string }): Spending {
  return useDbQuery(() => {
    const range = periodRange(period);
    const rows: { key: string | null; amount: number }[] = [];
    const targets = new Map<string, SpendingTarget | null>();
    const expenseTables = tablesRepo.list().filter((t) => t.category === 'expense');

    for (const table of expenseTables) {
      const fields = fieldsRepo.list(table.id);
      const amount = amountFieldOf(fields);
      if (!amount) continue;
      const group = filterFieldOf(fields);
      const sums = recordsRepo.sumGrouped(table.id, amount.id, group?.id ?? null, { dateFieldId: dateFieldOf(fields)?.id, ...range });
      for (const { key, total } of sums) {
        // Sans catégorie, un tableau compte comme une seule catégorie : son nom.
        const label = group ? key : table.name;
        rows.push({ key: label, amount: total });
        const name = label?.trim() || labels.none;
        const target: SpendingTarget = group && key ? { tableId: table.id, fieldId: group.id, value: key } : { tableId: table.id };
        // Une catégorie présente dans plusieurs tableaux n'a pas de lien unique.
        targets.set(name, targets.has(name) ? null : target);
      }
    }

    const items = breakdown(rows, 5, labels).map((item) => ({ ...item, target: item.other ? undefined : (targets.get(item.label) ?? undefined) }));
    return { total: Math.round(items.reduce((s, i) => s + i.amount, 0)), items, hasExpenseTable: expenseTables.length > 0 };
  }, [period, labels.none, labels.others]);
}
