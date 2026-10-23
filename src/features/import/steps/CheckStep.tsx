import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { recordsRepo } from '@/data/repositories';
import { useTable } from '@/features/tables/useTables';
import { FieldDefinitionError } from '@/services/fieldRules';
import { findDuplicates, mapRows, planImport, type ColumnMapping } from '@/services/import';
import { runImport, type ImportTarget } from '@/services/import/runImport';
import { Banner, Button, Card, CheckIcon, Chip, Screen, Text, UploadSimpleIcon, spacing } from '@/ui';

import { useImportWizard } from '../importStore';

const tempId = (column: number) => `col:${column}`;

/** Étapes 7 à 10 : doublons, valeurs invalides, confirmation puis import en transaction unique. */
export function CheckStep() {
  const { t } = useTranslation();
  const wizard = useImportWizard();
  const { fields } = useTable(wizard.target === 'existing' ? (wizard.tableId ?? '') : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sheet = wizard.sheet!;

  const { mappings, fieldNames, requiredFieldIds } = useMemo(() => {
    if (wizard.target === 'new') {
      const included = wizard.columns.map((c, column) => ({ ...c, column })).filter((c) => c.include);
      return {
        mappings: included.map((c): ColumnMapping => ({ column: c.column, fieldId: tempId(c.column), type: c.type })),
        fieldNames: Object.fromEntries(included.map((c) => [tempId(c.column), c.name])),
        requiredFieldIds: [] as string[],
      };
    }
    const byId = new Map(fields.map((f) => [f.id, f]));
    const mapped = wizard.mapping
      .map((fieldId, column) => (fieldId && byId.has(fieldId) ? { column, field: byId.get(fieldId)! } : null))
      .filter((m) => m !== null);
    return {
      mappings: mapped.map((m): ColumnMapping => ({ column: m.column, fieldId: m.field.id, type: m.field.type })),
      fieldNames: Object.fromEntries(fields.map((f) => [f.id, f.name])),
      requiredFieldIds: fields.filter((f) => f.required && f.type !== 'formula').map((f) => f.id),
    };
  }, [wizard.target, wizard.columns, wizard.mapping, fields]);

  const mapped = useMemo(() => mapRows(sheet, wizard.headerRow, mappings), [sheet, wizard.headerRow, mappings]);

  const duplicates = useMemo(() => {
    const existing = wizard.target === 'existing' && wizard.tableId ? recordsRepo.allData(wizard.tableId) : [];
    return findDuplicates(
      mapped.map((r) => r.data),
      existing,
      mappings.map((m) => m.fieldId),
    );
  }, [mapped, mappings, wizard.target, wizard.tableId]);

  const invalidCount = mapped.filter((r) => r.invalid.length > 0).length;
  const plan = useMemo(
    () =>
      planImport(mapped, {
        duplicates,
        skipDuplicates: wizard.skipDuplicates,
        invalidPolicy: wizard.invalidPolicy,
        fieldNames,
        requiredFieldIds,
      }),
    [mapped, duplicates, wizard.skipDuplicates, wizard.invalidPolicy, fieldNames, requiredFieldIds],
  );

  const confirm = () => {
    setBusy(true);
    setError(null);
    // Laisse l'écran afficher « Import en cours… » avant le travail synchrone.
    setTimeout(() => {
      try {
        const target: ImportTarget =
          wizard.target === 'new'
            ? {
                kind: 'new',
                name: wizard.newTableName,
                columns: wizard.columns
                  .map((c, column) => ({ ...c, column }))
                  .filter((c) => c.include)
                  .map((c) => ({
                    tempId: tempId(c.column),
                    name: c.name,
                    type: c.type,
                    choices:
                      c.type === 'choice'
                        ? [...new Set(mapped.map((r) => r.data[tempId(c.column)]).filter((v): v is string => typeof v === 'string'))].slice(0, 50)
                        : undefined,
                  })),
              }
            : { kind: 'existing', tableId: wizard.tableId! };
        const resultTableId = runImport(target, plan.rows);
        wizard.set({ step: 'report', report: plan.report, resultTableId });
      } catch (e) {
        setError(e instanceof FieldDefinitionError ? e.message : t('errors.generic'));
      } finally {
        setBusy(false);
      }
    }, 16);
  };

  return (
    <Screen
      footer={
        <>
          <Button
            icon={UploadSimpleIcon}
            loading={busy}
            label={busy ? t('import.importing') : t('import.confirm')}
            disabled={busy || plan.rows.length === 0}
            onPress={confirm}
          />
          <Button variant="secondary" label={t('common.back')} disabled={busy} onPress={() => wizard.set({ step: 'mapping' })} />
        </>
      }
    >
      {error ? <Banner tone="danger" title={error} /> : null}

      <Card>
        <Text variant="heading">{t('import.duplicates', { count: duplicates.size })}</Text>
        {duplicates.size > 0 ? (
          <Chip
            icon={wizard.skipDuplicates ? CheckIcon : undefined}
            label={t('import.skipDuplicates')}
            selected={wizard.skipDuplicates}
            onPress={() => wizard.set({ skipDuplicates: !wizard.skipDuplicates })}
          />
        ) : null}
      </Card>

      <Card>
        <Text variant="heading">{t('import.invalid', { count: invalidCount })}</Text>
        {invalidCount > 0 ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Chip
                label={t('import.invalidEmpty')}
                selected={wizard.invalidPolicy === 'empty'}
                onPress={() => wizard.set({ invalidPolicy: 'empty' })}
              />
              <Chip
                label={t('import.invalidSkip')}
                selected={wizard.invalidPolicy === 'skip'}
                onPress={() => wizard.set({ invalidPolicy: 'skip' })}
              />
            </View>
            {mapped
              .filter((r) => r.invalid.length)
              .slice(0, 5)
              .map((r) => (
                <Text key={r.line} variant="caption" tone="muted">
                  L{r.line} · {r.invalid.map((i) => `${fieldNames[i.fieldId] ?? ''} : « ${String(i.raw)} »`).join(', ')}
                </Text>
              ))}
          </>
        ) : null}
      </Card>

      <Text variant="heading" tone="primary">
        {t('import.summary', { count: plan.rows.length })}
      </Text>
    </Screen>
  );
}
