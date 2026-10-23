import { FlashList } from '@shopify/flash-list';
import type { TFunction } from 'i18next';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { recordsRepo, type RecordItem } from '@/data/repositories';
import type { Field } from '@/data/schema';
import { useFilters, type Period } from '@/features/search/filtersStore';
import { useRecords } from '@/features/search/useRecords';
import { useTable } from '@/features/tables/useTables';
import { formatDate } from '@/i18n/format';
import { exportTable } from '@/services/export/share';
import type { Value } from '@/services/formula';
import { fieldOptions, isUnitField, unitFor } from '@/services/fields';
import { formatAmount } from '@/services/money';
import { formatQuantity } from '@/services/quantity';
import { filterFieldOf, sortOptions, type SortOption } from '@/services/sorting';
import { amountFieldOf, dateFieldOf, isLowStock, titleFieldOf } from '@/services/summary';
import {
  Badge,
  Card,
  CheckIcon,
  Chip,
  EmptyState,
  ExportIcon,
  Fab,
  IconButton,
  ListRow,
  PencilSimpleIcon,
  SearchField,
  Section,
  Sheet,
  SortAscendingIcon,
  SortDescendingIcon,
  TableIcon,
  Text,
  iconSize,
  spacing,
  tabBarHeight,
  useTheme,
  useToast,
} from '@/ui';

const PERIODS: Period[] = ['all', 'today', 'week', 'month'];

const display = (
  field: Field | undefined,
  value: Value | undefined,
  t: TFunction,
  unit?: string | null,
): string => {
  if (!field || value === null || value === undefined || value === '') return '—';
  if (field.type === 'number' && typeof value === 'number') return formatQuantity(value, unit);
  if (field.type === 'photo') return t('records.photoAttached');
  if ((field.type === 'money' || field.type === 'formula') && typeof value === 'number') return formatAmount(Math.round(value));
  if (field.type === 'date' && typeof value === 'string') return formatDate(value);
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
  return String(value);
};

// Consultation : recherche, période, tri, total filtré, liste virtualisée (50 000 lignes).
export default function TableView() {
  const { tableId } = useLocalSearchParams<{ tableId: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const { table, fields } = useTable(tableId);
  const roles = useMemo(
    () => ({ title: titleFieldOf(fields), date: dateFieldOf(fields), amount: amountFieldOf(fields) }),
    [fields],
  );
  const filters = useFilters();
  const sorts = useMemo(() => sortOptions(fields), [fields]);
  const sort = sorts.find((o) => o.key === filters.sortKey) ?? sorts[0]!;
  const filterField = useMemo(() => filterFieldOf(fields), [fields]);
  const filterChoices = filterField ? (fieldOptions(filterField).choices ?? []) : [];
  const [sortOpen, setSortOpen] = useState(false);
  const { records, total, sum, query } = useRecords(tableId, { dateFieldId: roles.date?.id, amountFieldId: roles.amount?.id, sort });
  const resetFilters = filters.reset;
  // Les filtres sont propres au tableau ouvert.
  useEffect(resetFilters, [tableId, resetFilters]);
  const filtered = filters.search !== '' || filters.period !== 'all' || filters.equals !== null;
  const sortLabel = (o: SortOption) => t(`sort.${o.kind}`, { field: o.fieldName ?? '' });
  // Champs secondaires affichés sous le titre (hors titre, date et montant).
  const secondary = fields
    .filter((f) => f !== roles.title && f !== roles.date && f !== roles.amount)
    // Le champ « Unité » est affiché avec la quantité (« 3 kg »), pas à part.
    .filter((f) => !isUnitField(f))
    .slice(0, 2);

  // Export du résultat filtré (toutes les lignes, pas seulement la page affichée).
  const runExport = (format: 'xlsx' | 'csv') => {
    const rows = recordsRepo.list(tableId, { ...query, limit: 1_000_000 }).map((r) => r.data);
    exportTable(table?.name ?? 'tabilao', fields, rows, format).catch(() => toast.show(t('errors.generic'), 'error'));
  };
  const chooseExport = () =>
    Alert.alert(t('export.title'), t('export.filtered', { count: total }), [
      { text: t('export.xlsx'), onPress: () => runExport('xlsx') },
      { text: t('export.csv'), onPress: () => runExport('csv') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);

  const renderItem = ({ item }: { item: RecordItem }) => {
    const low = table?.category === 'stock' && isLowStock(fields, item.data);
    const amount = roles.amount ? item.data[roles.amount.id] : undefined;
    return (
      <Card
        style={styles.item}
        onPress={() => router.push({ pathname: '/tables/[tableId]/record/[recordId]', params: { tableId, recordId: item.id } })}
      >
        <View style={styles.itemMain}>
          <Text variant="heading" numberOfLines={1}>
            {display(roles.title, roles.title ? item.data[roles.title.id] : undefined, t)}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {[
              roles.date ? display(roles.date, item.data[roles.date.id], t) : formatDate(item.createdAt),
              ...secondary.map((f) => `${f.name} : ${display(f, item.data[f.id], t, unitFor(f, fields, item.data))}`),
            ].join(' · ')}
          </Text>
          {low ? <Badge label={t('records.lowStock')} /> : null}
        </View>
        {roles.amount ? (
          <Text variant="amount" tone={table?.category === 'expense' ? 'danger' : 'default'}>
            {display(roles.amount, amount, t)}
          </Text>
        ) : null}
      </Card>
    );
  };

  const openEditor = () => router.push({ pathname: '/tables/[tableId]/edit', params: { tableId } });

  // Tableau sans champ (créé vide) : on explique quoi faire au lieu d'afficher une liste vide.
  if (table && fields.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: table.name }} />
        <EmptyState
          icon={TableIcon}
          title={t('fieldEditor.emptyTitle')}
          message={t('fieldEditor.emptyMessage')}
          actionLabel={t('fieldEditor.addFields')}
          onAction={openEditor}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: table?.name ?? '',
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton icon={ExportIcon} label={t('export.title')} onPress={chooseExport} />
              <IconButton
                icon={PencilSimpleIcon}
                label={t('tables.editFields')}
                onPress={openEditor}
              />
            </View>
          ),
        }}
      />
      <FlashList
        data={records}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: tabBarHeight + spacing.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={styles.filters}>
            <SearchField value={filters.search} onChangeText={filters.setSearch} placeholder={t('common.search')} clearLabel={t('common.clear')} />
            <View style={styles.chips}>
              {PERIODS.map((p) => (
                <Chip key={p} label={t(`filters.${p}`)} selected={filters.period === p} onPress={() => filters.setPeriod(p)} />
              ))}
            </View>
            {filterField && filterChoices.length ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="caption" tone="muted">
                  {filterField.name}
                </Text>
                <View style={styles.chips}>
                  <Chip label={t('filters.all')} selected={filters.equals === null} onPress={() => filters.setEquals(null)} />
                  {filterChoices.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      accessibilityLabel={`${filterField.name} : ${c}`}
                      selected={filters.equals?.value === c}
                      onPress={() => filters.setEquals({ fieldId: filterField.id, value: c })}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            <View style={[styles.summary, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="muted">
                  {t('common.rows', { count: total })}
                </Text>
                {sum !== null ? (
                  <Text variant="amount" tone="primary">
                    {t('records.total')} : {formatAmount(sum)}
                  </Text>
                ) : null}
              </View>
              <Chip
                icon={sort.direction === 'desc' ? SortDescendingIcon : SortAscendingIcon}
                label={sortLabel(sort)}
                accessibilityLabel={`${t('sort.title')} : ${sortLabel(sort)}`}
                onPress={() => setSortOpen(true)}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={TableIcon}
            title={filtered ? t('records.noMatch') : t('records.emptyTitle')}
            message={filtered ? undefined : t('records.emptyMessage')}
            actionLabel={filtered ? t('common.clear') : undefined}
            onAction={filters.reset}
          />
        }
      />
      <Fab label={t('nav.entry')} onPress={() => router.push({ pathname: '/tables/[tableId]/entry', params: { tableId } })} />
      <Sheet visible={sortOpen} title={t('sort.title')} closeLabel={t('common.close')} onClose={() => setSortOpen(false)}>
        <Section flush>
          {sorts.map((o) => (
            <ListRow
              key={o.key}
              icon={o.direction === 'desc' ? SortDescendingIcon : SortAscendingIcon}
              iconBg={o.key === sort.key ? 'primarySoft' : undefined}
              iconFg={o.key === sort.key ? 'onPrimarySoft' : undefined}
              title={sortLabel(o)}
              trailing={o.key === sort.key ? <CheckIcon size={iconSize.md} color={colors.primary} weight="bold" /> : <View />}
              onPress={() => {
                filters.setSortKey(o.key);
                setSortOpen(false);
              }}
            />
          ))}
        </Section>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row' },
  filters: { gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemMain: { flex: 1, gap: 2 },
});
