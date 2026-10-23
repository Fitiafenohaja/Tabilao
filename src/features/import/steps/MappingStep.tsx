import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { FieldType } from '@/data/schema';
import { useTable, useTables } from '@/features/tables/useTables';
import { headerNames } from '@/services/import';
import { Button, Card, CheckIcon, Chip, Screen, Text, TextField, spacing } from '@/ui';

import { useImportWizard } from '../importStore';

const IMPORT_TYPES: FieldType[] = ['text', 'number', 'money', 'date', 'boolean', 'choice'];

/** Étape 6 : destination et association des colonnes aux champs, types proposés automatiquement. */
export function MappingStep() {
  const { t } = useTranslation();
  const wizard = useImportWizard();
  const tables = useTables();
  const { fields } = useTable(wizard.tableId ?? '');
  const names = headerNames(wizard.sheet!, wizard.headerRow);
  const editable = fields.filter((f) => f.type !== 'formula');

  const ready =
    wizard.target === 'new'
      ? wizard.newTableName.trim() !== '' && wizard.columns.some((c) => c.include && c.name.trim())
      : wizard.tableId !== null && wizard.mapping.some((m) => m !== null);

  const setColumn = (i: number, patch: Partial<(typeof wizard.columns)[number]>) =>
    wizard.set({ columns: wizard.columns.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const setMapping = (i: number, fieldId: string | null) =>
    wizard.set({ mapping: wizard.mapping.map((m, j) => (j === i ? fieldId : m === fieldId && fieldId !== null ? null : m)) });

  const chooseTable = (tableId: string) => wizard.set({ tableId, mapping: names.map(() => null) });

  return (
    <Screen
      footer={
        <>
          {!ready ? (
            <Text variant="caption" tone="warning">
              {t('import.noMapping')}
            </Text>
          ) : null}
          <Button label={t('common.next')} disabled={!ready} onPress={() => wizard.set({ step: 'check' })} />
          <Button variant="secondary" label={t('common.back')} onPress={() => wizard.set({ step: 'file' })} />
        </>
      }
    >
      <Text variant="label" tone="muted">
        {t('import.target')}
      </Text>
      <View style={styles.wrap}>
        <Chip label={t('import.newTable')} selected={wizard.target === 'new'} onPress={() => wizard.set({ target: 'new' })} />
        {tables.length ? (
          <Chip
            label={t('import.existingTable')}
            selected={wizard.target === 'existing'}
            onPress={() => wizard.set({ target: 'existing' })}
          />
        ) : null}
      </View>

      {wizard.target === 'new' ? (
        <>
          <TextField label={t('import.tableName')} value={wizard.newTableName} onChangeText={(newTableName) => wizard.set({ newTableName })} />
          <Text variant="heading">{t('import.mapping')}</Text>
          {wizard.columns.map((col, i) => (
            <Card key={i} style={!col.include && { opacity: 0.55 }}>
              <View style={[styles.wrap, { alignItems: 'center' }]}>
                <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                  {t('import.column')} {i + 1}
                </Text>
                <Chip
                  icon={col.include ? CheckIcon : undefined}
                  label={col.include ? names[i]! : t('import.ignore')}
                  accessibilityLabel={`${t('import.column')} ${i + 1} : ${col.include ? names[i] : t('import.ignore')}`}
                  selected={col.include}
                  onPress={() => setColumn(i, { include: !col.include })}
                />
              </View>
              {col.include ? (
                <>
                  <TextField label={t('fieldEditor.name')} value={col.name} onChangeText={(name) => setColumn(i, { name })} />
                  <View style={styles.wrap}>
                    {IMPORT_TYPES.map((type) => (
                      <Chip key={type} label={t(`fieldTypes.${type}`)} selected={col.type === type} onPress={() => setColumn(i, { type })} />
                    ))}
                  </View>
                </>
              ) : null}
            </Card>
          ))}
        </>
      ) : (
        <>
          <View style={styles.wrap}>
            {tables.map((table) => (
              <Chip key={table.id} label={table.name} selected={wizard.tableId === table.id} onPress={() => chooseTable(table.id)} />
            ))}
          </View>
          <Text variant="heading">{t('import.mapping')}</Text>
          {names.map((name, i) => (
            <Card key={i}>
              <Text variant="label">{name}</Text>
              <View style={styles.wrap}>
                <Chip label={t('import.ignore')} selected={wizard.mapping[i] === null} onPress={() => setMapping(i, null)} />
                {editable.map((f) => (
                  <Chip key={f.id} label={f.name} selected={wizard.mapping[i] === f.id} onPress={() => setMapping(i, f.id)} />
                ))}
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
