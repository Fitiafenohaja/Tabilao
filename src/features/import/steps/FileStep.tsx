import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { fieldsRepo, tablesRepo } from '@/data/repositories';
import {
  detectHeaderRow,
  guessType,
  headerNames,
  ImportError,
  IMPORT_LIMITS,
  listSheets,
  readCsv,
  readXlsx,
  type RawSheet,
} from '@/services/import';
import { Button, Card, Chip, EmptyState, FileArrowDownIcon, Screen, Text, spacing, useToast } from '@/ui';

import { useImportWizard } from '../importStore';

/** Étapes 1 à 5 : fichier, lecture et validation, feuille, en-têtes, aperçu. */
export function FileStep() {
  const { t } = useTranslation();
  const toast = useToast();
  const wizard = useImportWizard();

  const fail = (e: unknown) => toast.show(e instanceof ImportError ? e.message : t('errors.generic'), 'error');

  const loadSheet = (sheet: RawSheet) => wizard.set({ sheet, headerRow: detectHeaderRow(sheet) });

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'text/csv',
        'text/comma-separated-values',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      copyToCacheDirectory: true,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;
    try {
      const bytes = await new File(asset.uri).bytes();
      const isCsv = !asset.name.toLowerCase().endsWith('.xlsx');
      const sheets = isCsv ? [asset.name] : listSheets(bytes);
      wizard.set({ fileName: asset.name, bytes, isCsv, sheets, newTableName: asset.name.replace(/\.[^.]+$/, '') });
      loadSheet(isCsv ? readCsv(bytes, asset.name) : readXlsx(bytes, sheets[0]));
    } catch (e) {
      fail(e);
    }
  };

  const chooseSheet = (name: string) => {
    if (!wizard.bytes) return;
    try {
      loadSheet(readXlsx(wizard.bytes, name));
    } catch (e) {
      fail(e);
    }
  };

  const next = () => {
    const sheet = wizard.sheet!;
    const names = headerNames(sheet, wizard.headerRow);
    const body = sheet.rows.slice(wizard.headerRow + 1);
    const columns = names.map((name, i) => ({ include: true, name, type: guessType(body.map((r) => r[i] ?? null), name) }));
    // Tableau existant proposé par défaut : le premier ; association automatique par nom.
    const tableId = wizard.tableId ?? tablesRepo.list()[0]?.id ?? null;
    const fields = tableId ? fieldsRepo.list(tableId) : [];
    const mapping = names.map(
      (n) => fields.find((f) => f.type !== 'formula' && f.name.toLocaleLowerCase('fr') === n.toLocaleLowerCase('fr'))?.id ?? null,
    );
    wizard.set({ step: 'mapping', columns, mapping, tableId });
  };

  const sheet = wizard.sheet;
  const preview = sheet?.rows.slice(wizard.headerRow, wizard.headerRow + 1 + IMPORT_LIMITS.previewRows) ?? [];
  const maxHeader = Math.min(10, (sheet?.rows.length ?? 1) - 1);

  return (
    <Screen
      footer={
        <>
          {sheet ? <Button label={t('common.next')} onPress={next} /> : null}
          <Button variant={sheet ? 'secondary' : 'primary'} icon={FileArrowDownIcon} label={t('import.pick')} onPress={pick} />
        </>
      }
    >
      {wizard.fileName ? (
        <Text variant="heading">{wizard.fileName}</Text>
      ) : (
        <EmptyState icon={FileArrowDownIcon} title={t('onboarding.importFile')} message={t('data.importHint')} />
      )}

      {wizard.sheets.length > 1 ? (
        <>
          <Text variant="label" tone="muted">
            {t('import.chooseSheet')}
          </Text>
          <View style={styles.wrap}>
            {wizard.sheets.map((name) => (
              <Chip key={name} label={name} selected={sheet?.name === name} onPress={() => chooseSheet(name)} />
            ))}
          </View>
        </>
      ) : null}

      {sheet ? (
        <>
          <View style={[styles.wrap, { alignItems: 'center' }]}>
            <Chip label="−" onPress={() => wizard.set({ headerRow: Math.max(0, wizard.headerRow - 1) })} />
            <Text variant="label">{t('import.headerRow', { row: wizard.headerRow + 1 })}</Text>
            <Chip label="+" onPress={() => wizard.set({ headerRow: Math.min(maxHeader, wizard.headerRow + 1) })} />
          </View>
          <Text variant="caption" tone="muted">
            {t('import.preview')} · {t('common.rows', { count: sheet.rows.length - wizard.headerRow - 1 })}
          </Text>
          {preview.map((row, i) => (
            <Card key={i} style={{ padding: spacing.md }}>
              <Text variant={i === 0 ? 'label' : 'caption'} numberOfLines={2}>
                {row.map((c) => (c === null ? '—' : String(c))).join(' · ')}
              </Text>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
