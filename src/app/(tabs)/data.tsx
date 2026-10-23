import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { metaRepo } from '@/data/repositories';
import { useTables } from '@/features/tables/useTables';
import { useDbQuery } from '@/features/useDbQuery';
import { formatDate } from '@/i18n/format';
import { createBackup } from '@/services/backup';
import {
  Banner,
  Card,
  ClockCounterClockwiseIcon,
  ExportIcon,
  FileArrowDownIcon,
  FloppyDiskIcon,
  IconTile,
  ListRow,
  Screen,
  ScreenHeader,
  Section,
  ShieldCheckIcon,
  Text,
  spacing,
  useTheme,
  useToast,
} from '@/ui';

// Données : import, export, sauvegarde et restauration, regroupés.
export default function DataTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const tables = useTables();
  const lastBackup = useDbQuery(() => metaRepo.get('last_backup_at'), []);
  const [saving, setSaving] = useState(false);
  const rows = tables.reduce((n, table) => n + table.recordCount, 0);

  const backupNow = async () => {
    setSaving(true);
    try {
      await createBackup('manual');
      toast.show(t('backup.now'));
    } catch {
      toast.show(t('errors.generic'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('data.title')} subtitle={t('data.subtitle')} />
      <Screen inTabs>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <IconTile icon={ShieldCheckIcon} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading">{t('data.stats', { tables: tables.length, rows })}</Text>
            <Text variant="caption" tone="muted">
              {lastBackup ? t('data.lastBackup', { date: formatDate(lastBackup) }) : t('data.never')}
            </Text>
          </View>
        </Card>

        <Section title={t('data.sectionTransfer')} flush>
          <ListRow
            icon={FileArrowDownIcon}
            iconBg="primarySoft"
            iconFg="onPrimarySoft"
            title={t('import.title')}
            subtitle={t('data.importHint')}
            onPress={() => router.push('/import')}
          />
          <ListRow
            icon={ExportIcon}
            title={t('data.exportTitle')}
            subtitle={t('data.exportHint')}
            onPress={() => router.navigate('/tables')}
          />
        </Section>

        <Section title={t('data.sectionSafety')} flush>
          <ListRow
            icon={FloppyDiskIcon}
            iconBg="primarySoft"
            iconFg="onPrimarySoft"
            title={t('backup.now')}
            subtitle={t('data.backupHint')}
            disabled={saving}
            onPress={() => void backupNow()}
          />
          <ListRow
            icon={ClockCounterClockwiseIcon}
            title={t('backup.restore')}
            subtitle={t('data.restoreHint')}
            onPress={() => router.push('/backup')}
          />
        </Section>

        <Banner tone="info" title={t('data.privacy')} />
      </Screen>
    </View>
  );
}
