import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTables } from '@/features/tables/useTables';
import { EmptyState, ListRow, Screen, Section, TableIcon, categoryVisual, countKey } from '@/ui';

// Feuille « + Saisie » : choisir le tableau, puis saisie rapide (parcours en 3 gestes).
export default function QuickEntry() {
  const { t } = useTranslation();
  const tables = useTables();
  return (
    <Screen>
      <Stack.Screen options={{ title: t('quickEntry.title') }} />
      {tables.length === 0 ? (
        <EmptyState
          icon={TableIcon}
          title={t('home.noTablesTitle')}
          message={t('home.noTablesMessage')}
          actionLabel={t('home.createFirst')}
          onAction={() => router.replace('/tables/new')}
        />
      ) : (
        <View>
          <Section title={t('quickEntry.subtitle')} flush>
            {tables.map((table) => {
              const visual = categoryVisual(table.category);
              return (
                <ListRow
                  key={table.id}
                  icon={visual.icon}
                  iconBg={visual.bg}
                  iconFg={visual.fg}
                  title={table.name}
                  subtitle={t(countKey(table.category), { count: table.recordCount })}
                  onPress={() => router.replace({ pathname: '/tables/[tableId]/entry', params: { tableId: table.id } })}
                />
              );
            })}
          </Section>
        </View>
      )}
    </Screen>
  );
}
