import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import type { Field, FieldType } from '@/data/schema';
import { useTable } from '@/features/tables/useTables';
import { assertFieldSet, FieldDefinitionError } from '@/services/fieldRules';
import { UNITS } from '@/services/quantity';
import { deleteField, draftFromField, saveField, type FieldDraft } from '@/services/tables';
import { Banner, Button, CheckIcon, Chip, FloppyDiskIcon, Screen, Section, Text, TextField, TrashIcon, spacing, useToast } from '@/ui';

// Types proposés à la création ; « Référence » et « Photo » arrivent avec la v1.1.
const EDITABLE_TYPES: FieldType[] = ['text', 'number', 'money', 'date', 'boolean', 'choice', 'formula'];

const EMPTY: FieldDraft = {
  name: '',
  type: 'text',
  required: false,
  defaultValue: null,
  choices: [],
  formula: null,
  min: null,
  max: null,
  unit: null,
  integerOnly: false,
};

const parseNumber = (s: string): number | null => {
  const n = Number(s.replace(',', '.').replace(/\s/g, ''));
  return s.trim() === '' || Number.isNaN(n) ? null : n;
};

export default function FieldScreen() {
  const { tableId, fieldId } = useLocalSearchParams<{ tableId: string; fieldId?: string }>();
  const { fields } = useTable(tableId);
  const field = fieldId ? fields.find((f) => f.id === fieldId) : undefined;
  if (fieldId && !field) return null;
  return <FieldForm key={field?.id ?? 'new'} tableId={tableId} field={field} others={fields.filter((f) => f.id !== fieldId)} />;
}

function FieldForm({ tableId, field, others }: { tableId: string; field?: Field; others: Field[] }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [draft, setDraft] = useState<FieldDraft>(() => (field ? draftFromField(field) : EMPTY));
  const [choicesText, setChoicesText] = useState(draft.choices.join(', '));
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<FieldDraft>) => setDraft((d) => ({ ...d, ...patch }));

  // Vérification en direct de la formule, avec les autres champs du tableau.
  const formulaStatus = useMemo(() => {
    if (draft.type !== 'formula' || !draft.formula?.trim()) return null;
    try {
      assertFieldSet([...others, { name: draft.name.trim() || '?', type: 'formula', formula: draft.formula }]);
      return { ok: true, message: t('fieldEditor.formulaOk') };
    } catch (e) {
      return { ok: false, message: e instanceof FieldDefinitionError ? e.message : String(e) };
    }
  }, [draft.type, draft.formula, draft.name, others, t]);

  const save = () => {
    try {
      saveField(tableId, field?.id ?? null, { ...draft, choices: choicesText.split(',') });
      toast.show(t('fieldEditor.saved'));
      router.back();
    } catch (e) {
      setError(e instanceof FieldDefinitionError ? e.message : t('errors.generic'));
    }
  };

  const remove = () =>
    Alert.alert(t('fieldEditor.deleteField'), t('fieldEditor.deleteFieldConfirm', { name: field!.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          try {
            deleteField(tableId, field!.id);
            router.back();
          } catch (e) {
            setError(e instanceof FieldDefinitionError ? e.message : t('errors.generic'));
          }
        },
      },
    ]);

  const numeric = draft.type === 'number' || draft.type === 'money';
  const isFormula = draft.type === 'formula';
  const references = others.filter((f) => f.type !== 'photo');

  return (
    <Screen
      footer={
        <>
          <Button icon={FloppyDiskIcon} label={t('common.save')} onPress={save} />
          {field ? <Button variant="danger" icon={TrashIcon} label={t('fieldEditor.deleteField')} onPress={remove} /> : null}
        </>
      }
    >
      <Stack.Screen options={{ title: field ? t('fieldEditor.title') : t('fieldEditor.newTitle') }} />
      {error ? <Banner tone="danger" title={error} /> : null}

      <TextField label={t('fieldEditor.name')} value={draft.name} onChangeText={(name) => set({ name })} autoFocus={!field} />

      <Section title={t('fieldEditor.type')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {EDITABLE_TYPES.map((type) => (
            <Chip
              key={type}
              label={t(`fieldTypes.${type}`)}
              icon={draft.type === type ? CheckIcon : undefined}
              selected={draft.type === type}
              onPress={() => set({ type })}
            />
          ))}
        </View>
      </Section>

      {isFormula ? (
        <>
          <TextField
            label={t('fieldEditor.formula')}
            value={draft.formula ?? ''}
            onChangeText={(formula) => set({ formula })}
            help={formulaStatus?.ok ? formulaStatus.message : t('fieldEditor.formulaHelp')}
            error={formulaStatus && !formulaStatus.ok ? formulaStatus.message : undefined}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text variant="label" tone="muted">
            {t('fieldEditor.insertRef')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {references.map((f) => (
              <Chip key={f.id} label={f.name} onPress={() => set({ formula: `${draft.formula ?? ''}{${f.name}}` })} />
            ))}
            {['+', '−', '×', '÷'].map((op) => (
              <Chip key={op} label={op} onPress={() => set({ formula: `${draft.formula ?? ''} ${op} ` })} />
            ))}
          </View>
        </>
      ) : (
        <>
          <Chip
            icon={draft.required ? CheckIcon : undefined}
            label={t('fieldEditor.required')}
            selected={draft.required}
            onPress={() => set({ required: !draft.required })}
          />
          {draft.type === 'choice' ? (
            <TextField label={t('fieldEditor.choices')} value={choicesText} onChangeText={setChoicesText} />
          ) : null}
          {draft.type === 'number' ? (
            <>
              <Section title={t('fieldEditor.unit')}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <Chip label={t('fieldEditor.unitNone')} selected={!draft.unit} onPress={() => set({ unit: null })} />
                  {UNITS.map((u) => (
                    <Chip key={u.id} label={u.short} selected={draft.unit === u.short} onPress={() => set({ unit: u.short })} />
                  ))}
                </View>
                <Text variant="caption" tone="muted">
                  {t('fieldEditor.unitHint')}
                </Text>
              </Section>
              <Chip
                icon={draft.integerOnly ? CheckIcon : undefined}
                label={t('fieldEditor.integerOnly')}
                accessibilityLabel={`${t('fieldEditor.integerOnly')}. ${t('fieldEditor.integerOnlyHint')}`}
                selected={draft.integerOnly}
                onPress={() => set({ integerOnly: !draft.integerOnly })}
              />
              <Text variant="caption" tone="muted">
                {t('fieldEditor.integerOnlyHint')}
              </Text>
            </>
          ) : null}
          {numeric ? (
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label={t('fieldEditor.min')}
                  keyboardType="numeric"
                  value={draft.min === null ? '' : String(draft.min)}
                  onChangeText={(s) => set({ min: parseNumber(s) })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label={t('fieldEditor.max')}
                  keyboardType="numeric"
                  value={draft.max === null ? '' : String(draft.max)}
                  onChangeText={(s) => set({ max: parseNumber(s) })}
                />
              </View>
            </View>
          ) : null}
          <TextField
            label={t('fieldEditor.defaultValue')}
            value={draft.defaultValue ?? ''}
            onChangeText={(defaultValue) => set({ defaultValue })}
            keyboardType={numeric ? 'numeric' : 'default'}
            help={draft.type === 'date' ? t('fieldEditor.defaultHelpDate') : undefined}
          />
        </>
      )}
    </Screen>
  );
}
