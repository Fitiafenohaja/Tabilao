import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { metaRepo } from '@/data/repositories';
import { useHomeData, type TableCardData } from '@/features/home/useHomeData';
import { formatToday } from '@/i18n/format';
import { needsExternalBackupReminder } from '@/services/backup';
import { formatAmount } from '@/services/money';
import {
  Badge,
  Banner,
  Card,
  EmptyState,
  IconButton,
  IconTile,
  Logo,
  Screen,
  ScreenHeader,
  Section,
  StatTile,
  Text,
  categoryVisual,
  countKey,
  spacing,
  useTheme,
  GearSixIcon,
  TableIcon,
} from '@/ui';

// Accueil : synthèse du jour, alertes, accès direct aux tableaux.
export default function Home() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { tables, income, expenses } = useHomeData();

  if (!metaRepo.get('onboarding_done')) return <Redirect href="/onboarding" />;

  const lowStock = tables.reduce((n, table) => n + table.lowStock, 0);
  const firstStock = tables.find((table) => table.lowStock > 0);
  const openTable = (tableId: string) => router.push({ pathname: '/tables/[tableId]', params: { tableId } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        band
        title={t('app.name')}
        subtitle={formatToday()}
        leading={<Logo size={36} />}
        actions={<IconButton icon={GearSixIcon} label={t('settings.title')} onPress={() => router.push('/settings')} />}
      />
      <Screen inTabs>
        {tables.length === 0 ? (
          <EmptyState
            icon={TableIcon}
            title={t('home.noTablesTitle')}
            message={t('home.noTablesMessage')}
            actionLabel={t('home.createFirst')}
            onAction={() => router.push('/tables/new')}
          />
        ) : (
          <>
            <Section title={t('home.today')}>
              <Card style={styles.summary}>
                <StatTile kind="income" label={t('home.income')} value={income} />
                <StatTile kind="expense" label={t('home.expenses')} value={expenses} />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <StatTile kind="balance" label={t('home.balance')} value={income - expenses} />
              </Card>
            </Section>

            {lowStock > 0 || needsExternalBackupReminder() ? (
              <View style={styles.alerts}>
                {lowStock > 0 && firstStock ? (
                  <Banner tone="danger" title={t('home.lowStock', { count: lowStock })} onPress={() => openTable(firstStock.id)} />
                ) : null}
                {needsExternalBackupReminder() ? (
                  <Banner title={t('home.backupTitle')} message={t('home.backupMessage')} onPress={() => router.push('/backup')} />
                ) : null}
              </View>
            ) : null}

            <Section
              title={t('home.myTables')}
              action={
                <Text tone="primary" variant="label" accessibilityRole="button" onPress={() => router.navigate('/tables')} style={styles.link}>
                  {t('common.seeAll')}
                </Text>
              }
            >
              <View style={styles.grid}>
                {tables.slice(0, 6).map((table) => (
                  <TableTile key={table.id} table={table} onPress={() => openTable(table.id)} />
                ))}
              </View>
            </Section>
          </>
        )}
      </Screen>
    </View>
  );
}

function TableTile({ table, onPress }: { table: TableCardData; onPress: () => void }) {
  const { t } = useTranslation();
  const visual = categoryVisual(table.category);
  return (
    <Card style={styles.tile} onPress={onPress} accessibilityLabel={`${table.name}, ${t(countKey(table.category), { count: table.recordCount })}`}>
      <IconTile icon={visual.icon} bg={visual.bg} fg={visual.fg} />
      <Text variant="heading" numberOfLines={1}>
        {table.name}
      </Text>
      <Text variant="caption" tone="muted">
        {t(countKey(table.category), { count: table.recordCount })}
      </Text>
      {table.todayTotal !== null ? (
        <Text variant="label" tone={table.category === 'expense' ? 'danger' : 'primary'} numberOfLines={1}>
          {formatAmount(table.todayTotal)}
        </Text>
      ) : null}
      {table.lowStock > 0 ? <Badge label={t('home.lowStock', { count: table.lowStock })} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth },
  alerts: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { flexBasis: '47%', flexGrow: 1, gap: spacing.xs },
  link: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
});
