import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { tablesRepo } from '@/data/repositories';
import type { Field } from '@/data/schema';
import { useTable } from '@/features/tables/useTables';
import { missingPresets } from '@/services/fieldPresets';
import { addPresetField, moveField } from '@/services/tables';
import {
  Badge,
  Button,
  CalculatorIcon,
  CaretDownIcon,
  CaretUpIcon,
  Card,
  Chip,
  EmptyState,
  IconButton,
  PlusIcon,
  Screen,
  Section,
  Text,
  TableIcon,
  TextField,
  TrashIcon,
  iconSize,
  spacing,
  touchTarget,
  useTheme,
  useToast,
} from '@/ui';

// Éditeur de tableau : nom, champs (ordre, types, formules), archivage, suppression.
export default function EditTable() {
  const { tableId } = useLocalSearchParams<{ tableId: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const { table, fields } = useTable(tableId);
  const [name, setName] = useState(table?.name ?? '');
  const presets = missingPresets(fields, (id) => t(`presets.${id}`));

  if (!table) return null;

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) return setName(table.name);
    if (trimmed !== table.name) tablesRepo.update(tableId, { name: trimmed });
  };

  const openField = (fieldId?: string) =>
    router.push({ pathname: '/tables/[tableId]/field', params: fieldId ? { tableId, fieldId } : { tableId } });

  const toggleArchive = () => {
    tablesRepo.archive(tableId, !table.archivedAt);
    router.dismissTo('/');
  };

  const confirmDelete = () =>
    Alert.alert(t('fieldEditor.deleteTable'), t('tables.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.archive'), onPress: toggleArchive },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          tablesRepo.remove(tableId);
          toast.show(t('common.delete'));
          router.dismissTo('/');
        },
      },
    ]);

  return (
    <Screen
      footer={
        <>
          <Button icon={PlusIcon} label={t('fieldEditor.addField')} onPress={() => openField()} />
        </>
      }
    >
      <Stack.Screen options={{ title: t('tables.editFields') }} />
      <TextField label={t('fieldEditor.tableName')} value={name} onChangeText={setName} onEndEditing={saveName} />
      {fields.length === 0 ? (
        <EmptyState icon={TableIcon} title={t('fieldEditor.emptyTitle')} message={t('fieldEditor.emptyMessage')} />
      ) : null}

      {presets.length > 0 ? (
        <Section title={t('fieldEditor.quickAdd')}>
          <View style={styles.chips}>
            {presets.map((id) => (
              <Chip
                key={id}
                icon={PlusIcon}
                label={t(`presets.${id}`)}
                accessibilityLabel={`${t('fieldEditor.addField')} : ${t(`presets.${id}`)}`}
                onPress={() => {
                  addPresetField(tableId, id, (p) => t(`presets.${p}`));
                  toast.show(t('fieldEditor.saved'));
                }}
              />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            {t('fieldEditor.quickAddHint')}
          </Text>
        </Section>
      ) : null}

      <Section title={`${t('fieldEditor.fields')} · ${fields.length}`}>
        {fields.map((field, index) => (
          <FieldRow
            key={field.id}
            field={field}
            first={index === 0}
            last={index === fields.length - 1}
            onPress={() => openField(field.id)}
            onMove={(direction) => moveField(tableId, field.id, direction)}
          />
        ))}
      </Section>
      <Section>
        <Button
          variant="secondary"
          label={table.archivedAt ? t('fieldEditor.unarchiveTable') : t('fieldEditor.archiveTable')}
          onPress={toggleArchive}
        />
        <Button variant="danger" icon={TrashIcon} label={t('fieldEditor.deleteTable')} onPress={confirmDelete} />
      </Section>
    </Screen>
  );
}

type RowProps = { field: Field; first: boolean; last: boolean; onPress: () => void; onMove: (direction: -1 | 1) => void };

function FieldRow({ field, first, last, onPress, onMove }: RowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Card style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${field.name}, ${t(`fieldTypes.${field.type}`)}`}
        onPress={onPress}
        style={styles.main}
      >
        <Text variant="heading" numberOfLines={1}>
          {field.name}
        </Text>
        <View style={styles.meta}>
          {field.type === 'formula' ? <CalculatorIcon size={iconSize.sm} color={colors.onPrimarySoft} /> : null}
          <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {field.formula ? `= ${field.formula}` : t(`fieldTypes.${field.type}`)}
          </Text>
        </View>
        {field.required ? <Badge tone="success" label={t('fieldEditor.required')} /> : null}
      </Pressable>
      <View>
        <IconButton icon={CaretUpIcon} label={`${t('common.moveUp')} ${field.name}`} disabled={first} onPress={() => onMove(-1)} />
        <IconButton icon={CaretDownIcon} label={`${t('common.moveDown')} ${field.name}`} disabled={last} onPress={() => onMove(1)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, paddingRight: spacing.xs },
  main: { flex: 1, gap: spacing.xs, minHeight: touchTarget, justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
