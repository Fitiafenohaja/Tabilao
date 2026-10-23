import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { TableSummary } from '@/data/repositories';
import { useTables } from '@/features/tables/useTables';
import { formatDate } from '@/i18n/format';
import {
  Card,
  Chip,
  EmptyState,
  FileArrowDownIcon,
  IconButton,
  IconTile,
  PlusIcon,
  Screen,
  ScreenHeader,
  SearchField,
  Text,
  categoryVisual,
  spacing,
  useTheme,
  CaretRightIcon,
  TableIcon,
  iconSize,
} from '@/ui';

// Liste des tableaux : recherche, archivés, création et import en un geste.
export default function TablesTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState('');
  const tables = useTables(archived);
  const query = search.trim().toLocaleLowerCase('fr');
  const visible = query ? tables.filter((table) => table.name.toLocaleLowerCase('fr').includes(query)) : tables;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title={t('tables.title')}
        subtitle={t('common.rows', { count: tables.reduce((n, table) => n + table.recordCount, 0) })}
        actions={
          <>
            <IconButton icon={FileArrowDownIcon} label={t('import.title')} onPress={() => router.push('/import')} />
            <IconButton icon={PlusIcon} tone="primary" label={t('tables.new')} onPress={() => router.push('/tables/new')} />
          </>
        }
      />
      <Screen inTabs>
        <View style={styles.filters}>
          <SearchField value={search} onChangeText={setSearch} placeholder={t('tables.searchPlaceholder')} clearLabel={t('common.clear')} />
          <View style={styles.chips}>
            <Chip label={t('tables.title')} selected={!archived} onPress={() => setArchived(false)} />
            <Chip label={t('tables.archived')} selected={archived} onPress={() => setArchived(true)} />
          </View>
        </View>

        {visible.length === 0 ? (
          <EmptyState
            icon={TableIcon}
            title={query ? t('tables.noResult') : t('tables.empty')}
            actionLabel={!query && !archived ? t('tables.new') : undefined}
            onAction={() => router.push('/tables/new')}
          />
        ) : (
          <View style={styles.list}>
            {visible.map((table) => (
              <TableRow key={table.id} table={table} />
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

function TableRow({ table }: { table: TableSummary }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const visual = categoryVisual(table.category);
  const rows = t('common.rows', { count: table.recordCount });
  return (
    <Card
      style={styles.row}
      accessibilityLabel={`${table.name}, ${rows}`}
      onPress={() => router.push({ pathname: '/tables/[tableId]', params: { tableId: table.id } })}
    >
      <IconTile icon={visual.icon} bg={visual.bg} fg={visual.fg} />
      <View style={styles.rowText}>
        <Text variant="heading" numberOfLines={1}>
          {table.name}
        </Text>
        <Text variant="caption" tone="muted">
          {rows} · {formatDate(table.updatedAt)}
        </Text>
      </View>
      <CaretRightIcon size={iconSize.sm} color={colors.placeholder} />
    </Card>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
});
