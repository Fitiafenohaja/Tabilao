import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { SummaryPeriod } from '@/features/home/useHomeData';
import { useSpending, type SpendingItem } from '@/features/insights/useSpending';
import { percent } from '@/services/insights';
import { formatAmount } from '@/services/money';
import { Card, ChartBarIcon, EmptyState, Screen, Segmented, ShareBar, Text, WalletIcon, spacing, useTheme } from '@/ui';

const PERIODS: SummaryPeriod[] = ['today', 'week', 'month'];

// « Où va mon argent ? » : dépenses de la période par catégorie, de la plus grosse à la plus petite.
export default function SpendingScreen() {
  const params = useLocalSearchParams<{ period?: SummaryPeriod }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<SummaryPeriod>(PERIODS.includes(params.period as SummaryPeriod) ? params.period! : 'month');
  const { total, items, hasExpenseTable } = useSpending(period, { none: t('spending.none'), others: t('spending.others') });

  const open = (item: SpendingItem) => {
    if (!item.target) return;
    router.push({
      pathname: '/tables/[tableId]',
      params: {
        tableId: item.target.tableId,
        period,
        ...(item.target.fieldId && item.target.value ? { filterField: item.target.fieldId, filterValue: item.target.value } : {}),
      },
    });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('spending.title') }} />
      <Segmented label={t('spending.period')} value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p, label: t(`filters.${p}`) }))} />

      {!hasExpenseTable ? (
        <EmptyState
          icon={WalletIcon}
          title={t('spending.noTable')}
          message={t('spending.noTableMessage')}
          actionLabel={t('tables.new')}
          onAction={() => router.push('/tables/new')}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={ChartBarIcon} title={t('spending.nothing')} message={t('spending.nothingMessage')} />
      ) : (
        <>
          <View style={styles.total} accessible accessibilityLabel={`${t('spending.total')} : ${formatAmount(total)}`}>
            <Text variant="label" tone="muted">
              {t('spending.total')}
            </Text>
            <Text variant="display" style={{ color: colors.expense }}>
              {formatAmount(total)}
            </Text>
            {items[0] ? (
              <Text tone="muted">{t('spending.topSentence', { label: items[0].label, percent: percent(items[0].share) })}</Text>
            ) : null}
          </View>

          <Card style={styles.list}>
            {items.map((item, i) => (
              <View key={item.label} style={i > 0 ? [styles.divider, { borderTopColor: colors.border }] : undefined}>
                <ShareBar
                  label={item.label}
                  amount={formatAmount(item.amount)}
                  percent={percent(item.share)}
                  onPress={item.target ? () => open(item) : undefined}
                  hint={item.target ? t('spending.openHint') : undefined}
                />
              </View>
            ))}
          </Card>
          <Text variant="caption" tone="muted">
            {t('spending.footnote')}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: { gap: spacing.xs, paddingTop: spacing.sm },
  list: { padding: 0, gap: 0, overflow: 'hidden' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
});
