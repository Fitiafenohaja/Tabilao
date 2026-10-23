import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { shareFile } from '@/services/export/share';
import { issuesToCsv } from '@/services/import';
import { Button, Card, CheckCircleIcon, ExportIcon, IconTile, Screen, Text, TableIcon, useToast } from '@/ui';

import { useImportWizard } from '../importStore';

/** Étape 10 : rapport final, export du rapport d'erreurs. */
export function ReportStep() {
  const { t } = useTranslation();
  const toast = useToast();
  const wizard = useImportWizard();
  const report = wizard.report!;

  const exportErrors = () =>
    shareFile('rapport-import', 'csv', issuesToCsv(report.issues), t('import.report')).catch(() =>
      toast.show(t('errors.generic'), 'error'),
    );

  const openTable = () => {
    const tableId = wizard.resultTableId!;
    wizard.reset();
    router.replace({ pathname: '/tables/[tableId]', params: { tableId } });
  };

  return (
    <Screen
      footer={
        <>
          <Button icon={TableIcon} label={t('import.openTable')} onPress={openTable} />
          {report.issues.length ? <Button variant="secondary" icon={ExportIcon} label={t('import.exportErrors')} onPress={exportErrors} /> : null}
          <Button variant="secondary" label={t('import.again')} onPress={wizard.reset} />
        </>
      }
    >
      <View style={{ alignItems: 'center', gap: 8 }}>
        <IconTile icon={CheckCircleIcon} size="lg" />
        <Text variant="title">{t('import.report')}</Text>
      </View>
      <Card>
        <Stat label={t('import.imported')} value={report.imported} tone="primary" />
        <Stat label={t('import.skipped')} value={report.skipped} tone={report.skipped ? 'warning' : 'muted'} />
        <Stat label={t('import.corrected')} value={report.corrected} tone="muted" />
      </Card>
      {report.issues.slice(0, 20).map((issue, i) => (
        <Text key={i} variant="caption" tone="muted">
          L{issue.line} {issue.field ? `· ${issue.field} ` : ''}· {issue.reason}
        </Text>
      ))}
    </Screen>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'warning' | 'muted' }) {
  return (
    <View style={styles.stat}>
      <Text>{label}</Text>
      <Text variant="amount" tone={tone}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: { flexDirection: 'row', justifyContent: 'space-between' },
});
