import { router, useLocalSearchParams } from 'expo-router';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Field } from '@/data/schema';
import { useEntryForm } from '@/features/entry/useEntryForm';
import { useTable } from '@/features/tables/useTables';
import { fieldOptions } from '@/services/fields';
import { formatAmount } from '@/services/money';
import { Button, CheckIcon, Chip, ComputedField, FloppyDiskIcon, PlusIcon, Screen, Text, TextField, WarningIcon, spacing, useTheme, useToast } from '@/ui';

// Saisie rapide : parcours en 3 gestes (toucher, remplir, enregistrer).
export default function Entry() {
  const { tableId } = useLocalSearchParams<{ tableId: string }>();
  const { fields } = useTable(tableId);
  if (fields.length === 0) return null;
  return <EntryForm tableId={tableId} fields={fields} />;
}

function EntryForm({ tableId, fields }: { tableId: string; fields: Field[] }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { form, computed, save } = useEntryForm(tableId, fields);
  const errors = form.formState.errors;

  const onSaved = (next: boolean) => () => {
    toast.show(t('entry.saved'));
    if (!next) router.back();
  };

  return (
    <Screen
      footer={
        <>
          <Button variant="secondary" icon={PlusIcon} label={t('common.saveAndNext')} onPress={save(onSaved(true))} />
          <Button icon={FloppyDiskIcon} label={t('common.save')} onPress={save(onSaved(false))} />
        </>
      }
    >
      {fields.map((field) => {
        if (field.type === 'formula') {
          const value = computed.data[field.id];
          return (
            <ComputedField
              key={field.id}
              label={field.name}
              value={typeof value === 'number' ? formatAmount(Math.round(value)) : String(value ?? '—')}
              error={computed.errors[field.id]}
            />
          );
        }
        const error = errors[field.id]?.message as string | undefined;
        return (
          <Controller
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: input }) =>
              field.type === 'choice' || field.type === 'boolean' ? (
                <View style={{ gap: spacing.xs }}>
                  <Text variant="label" tone="muted">
                    {field.name}
                    {field.required ? <Text variant="label" tone="danger"> *</Text> : null}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {(field.type === 'boolean' ? [true, false] : (fieldOptions(field).choices ?? [])).map((value) => {
                      const label = typeof value === 'boolean' ? t(value ? 'common.yes' : 'common.no') : value;
                      return (
                        <Chip
                          key={label}
                          label={label}
                          icon={input.value === value ? CheckIcon : undefined}
                          selected={input.value === value}
                          onPress={() => input.onChange(value)}
                        />
                      );
                    })}
                  </View>
                  {error ? <FieldError message={error} /> : null}
                </View>
              ) : (
                <TextField
                  label={field.name}
                  required={field.required}
                  value={input.value === null || input.value === undefined ? '' : String(input.value)}
                  onChangeText={input.onChange}
                  onBlur={input.onBlur}
                  keyboardType={field.type === 'number' || field.type === 'money' ? 'numeric' : 'default'}
                  placeholder={field.type === 'date' ? 'AAAA-MM-JJ' : undefined}
                  error={error}
                />
              )
            }
          />
        );
      })}
    </Screen>
  );
}

function FieldError({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }} accessibilityLiveRegion="polite">
      <WarningIcon size={14} color={colors.danger} weight="fill" />
      <Text variant="caption" tone="danger">
        {message}
      </Text>
    </View>
  );
}
