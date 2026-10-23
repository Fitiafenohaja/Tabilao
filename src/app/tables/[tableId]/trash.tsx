import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { recordsRepo } from '@/data/repositories';
import { useTable } from '@/features/tables/useTables';
import { useDbQuery } from '@/features/useDbQuery';
import { formatDate } from '@/i18n/format';
import { formatAmount } from '@/services/money';
import { amountFieldOf, titleFieldOf } from '@/services/summary';
import { daysBeforePurge, TRASH_RETENTION_DAYS } from '@/services/trash';
import { ArrowUUpLeftIcon, Banner, EmptyState, IconButton, ListRow, Screen, Section, TrashIcon, useToast } from '@/ui';

// Corbeille d'un tableau : lignes supprimées, restaurables pendant 30 jours.
export default function Trash() {
  const { tableId } = useLocalSearchParams<{ tableId: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const { fields } = useTable(tableId);
  const deleted = useDbQuery(() => recordsRepo.trash(tableId), [tableId]);
  const title = titleFieldOf(fields);
  const amount = amountFieldOf(fields);

  const restore = (id: string) => {
    recordsRepo.restore([id]);
    toast.show(t('trash.restored'));
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('trash.title') }} />
      <Banner tone="info" title={t('trash.explain', { days: TRASH_RETENTION_DAYS })} />
      {deleted.length === 0 ? (
        <EmptyState icon={TrashIcon} title={t('trash.empty')} />
      ) : (
        <Section flush>
          {deleted.map((r) => {
            const name = title ? String(r.data[title.id] ?? '') : '';
            const value = amount && typeof r.data[amount.id] === 'number' ? formatAmount(Math.round(r.data[amount.id] as number)) : '';
            const label = [name, value].filter(Boolean).join(' · ') || formatDate(r.createdAt);
            return (
              <ListRow
                key={r.id}
                icon={TrashIcon}
                title={label}
                subtitle={t('trash.when', {
                  date: formatDate(r.deletedAt ?? r.updatedAt),
                  count: daysBeforePurge(r.deletedAt ?? r.updatedAt),
                })}
                trailing={
                  <IconButton icon={ArrowUUpLeftIcon} tone="primary" label={`${t('trash.restore')} ${label}`} onPress={() => restore(r.id)} />
                }
              />
            );
          })}
        </Section>
      )}
    </Screen>
  );
}
