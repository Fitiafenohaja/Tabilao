import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import type { Field, FieldType } from '@/data/schema';
import { useTable } from '@/features/tables/useTables';
import { assertFieldSet, FieldDefinitionError } from '@/services/fieldRules';
import {
  buildSimpleFormula,
  OPERATOR_SYMBOL,
  parseSimpleFormula,
  SIMPLE_OPERATORS,
  type SimpleFormula,
} from '@/services/formula';
import { UNITS } from '@/services/quantity';
import { deleteField, draftFromField, saveField, type FieldDraft } from '@/services/tables';
import {
  Banner,
  Button,
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckIcon,
  Chip,
  FloppyDiskIcon,
  Screen,
  Section,
  Text,
  TextField,
  TrashIcon,
  iconSize,
  spacing,
  useTheme,
  useToast,
} from '@/ui';

// Types proposés, du plus courant au plus rare ; « Référence » arrive avec le lien ventes → stock (v1.1).
const EDITABLE_TYPES: FieldType[] = ['text', 'number', 'money', 'date', 'choice', 'boolean', 'photo', 'formula'];
const NUMERIC_TYPES: FieldType[] = ['number', 'money', 'formula'];

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

/**
 * Fiche d'une colonne : nom et type d'abord (avec un exemple pour chaque type),
 * réglages propres au type ensuite, et les réglages rares repliés sous « Options avancées ».
 */
function FieldForm({ tableId, field, others }: { tableId: string; field?: Field; others: Field[] }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [draft, setDraft] = useState<FieldDraft>(() => (field ? draftFromField(field) : EMPTY));
  const [choicesText, setChoicesText] = useState(draft.choices.join(', '));
  const [error, setError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const set = (patch: Partial<FieldDraft>) => setDraft((d) => ({ ...d, ...patch }));

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
  const hasAdvanced = draft.type !== 'formula' && draft.type !== 'photo';

  return (
    <Screen
      footer={
        <>
          <Button icon={FloppyDiskIcon} label={t('common.save')} disabled={!draft.name.trim()} onPress={save} />
          {field ? <Button variant="danger" icon={TrashIcon} label={t('fieldEditor.deleteField')} onPress={remove} /> : null}
        </>
      }
    >
      <Stack.Screen options={{ title: field ? t('fieldEditor.title') : t('fieldEditor.newTitle') }} />
      {error ? <Banner tone="danger" title={error} /> : null}

      <TextField
        label={t('fieldEditor.name')}
        placeholder={t('fieldEditor.namePlaceholder')}
        value={draft.name}
        onChangeText={(name) => set({ name })}
        autoFocus={!field}
      />

      <Section title={t('fieldEditor.type')}>
        <View style={styles.types}>
          {EDITABLE_TYPES.map((type) => (
            <TypeOption key={type} type={type} selected={draft.type === type} onPress={() => set({ type })} />
          ))}
        </View>
      </Section>

      {draft.type === 'formula' ? (
        <FormulaBuilder
          formula={draft.formula}
          name={draft.name}
          others={others}
          onChange={(formula) => set({ formula })}
        />
      ) : null}

      {draft.type === 'choice' ? (
        <TextField
          label={t('fieldEditor.choices')}
          placeholder={t('fieldEditor.choicesPlaceholder')}
          value={choicesText}
          onChangeText={setChoicesText}
        />
      ) : null}

      {draft.type === 'number' ? (
        <Section title={t('fieldEditor.unit')}>
          <View style={styles.chips}>
            <Chip label={t('fieldEditor.unitNone')} selected={!draft.unit} onPress={() => set({ unit: null })} />
            {UNITS.map((u) => (
              <Chip key={u.id} label={u.short} selected={draft.unit === u.short} onPress={() => set({ unit: u.short })} />
            ))}
          </View>
        </Section>
      ) : null}

      {draft.type === 'date' ? (
        <Section title={t('fieldEditor.defaultValue')}>
          <View style={styles.chips}>
            <Chip label={t('fieldEditor.defaultNone')} selected={!draft.defaultValue} onPress={() => set({ defaultValue: null })} />
            <Chip
              label={t('fieldEditor.defaultToday')}
              icon={draft.defaultValue === '@today' ? CheckIcon : undefined}
              selected={draft.defaultValue === '@today'}
              onPress={() => set({ defaultValue: '@today' })}
            />
          </View>
        </Section>
      ) : null}

      {hasAdvanced ? (
        <View style={{ gap: spacing.md }}>
          <Disclosure label={t('fieldEditor.advanced')} open={advanced} onToggle={() => setAdvanced((a) => !a)} />
          {advanced ? (
            <>
              <Chip
                icon={draft.required ? CheckIcon : undefined}
                label={t('fieldEditor.required')}
                accessibilityLabel={`${t('fieldEditor.required')}. ${t('fieldEditor.requiredHint')}`}
                selected={draft.required}
                onPress={() => set({ required: !draft.required })}
              />
              <Text variant="caption" tone="muted">
                {t('fieldEditor.requiredHint')}
              </Text>

              {draft.type === 'number' ? (
                <>
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
                <View style={styles.row}>
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

              {draft.type !== 'date' ? (
                <TextField
                  label={t('fieldEditor.defaultValue')}
                  help={t('fieldEditor.defaultHint')}
                  value={draft.defaultValue ?? ''}
                  onChangeText={(defaultValue) => set({ defaultValue })}
                  keyboardType={numeric ? 'numeric' : 'default'}
                />
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

/** Type de colonne : nom + exemple concret, sélection unique. */
function TypeOption({ type, selected, onPress }: { type: FieldType; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${t(`fieldTypes.${type}`)}. ${t(`typeHints.${type}`)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.type,
        {
          backgroundColor: selected ? colors.primaryTint : pressed ? colors.neutralSoft : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" style={{ fontFamily: 'Inter-SemiBold' }}>
          {t(`fieldTypes.${type}`)}
        </Text>
        <Text variant="caption" tone="muted">
          {t(`typeHints.${type}`)}
        </Text>
      </View>
      {selected ? <CheckCircleIcon size={iconSize.md} color={colors.primary} weight="fill" /> : null}
    </Pressable>
  );
}

/**
 * Calcul automatique : [colonne] [× + − ÷] [colonne] avec des boutons.
 * Pour un calcul plus complexe (SI, SOMME, parenthèses), mode « écrire moi-même ».
 */
function FormulaBuilder({
  formula,
  name,
  others,
  onChange,
}: {
  formula: string | null;
  name: string;
  others: Field[];
  onChange: (formula: string) => void;
}) {
  const { t } = useTranslation();
  const initial = parseSimpleFormula(formula);
  const [free, setFree] = useState(!!formula && !initial);
  const [parts, setParts] = useState<Partial<SimpleFormula>>(initial ?? { op: '*' });
  const candidates = others.filter((f) => NUMERIC_TYPES.includes(f.type));

  const update = (patch: Partial<SimpleFormula>) => {
    const next = { ...parts, ...patch };
    setParts(next);
    if (next.left && next.op && next.right) onChange(buildSimpleFormula(next as SimpleFormula));
  };

  const status = useMemo(() => {
    if (!formula?.trim()) return null;
    try {
      assertFieldSet([...others, { name: name.trim() || '?', type: 'formula', formula }]);
      return { ok: true, message: t('fieldEditor.formulaOk') };
    } catch (e) {
      return { ok: false, message: e instanceof FieldDefinitionError ? e.message : String(e) };
    }
  }, [formula, name, others, t]);

  if (candidates.length === 0 && !free) {
    return <Banner tone="info" title={t('fieldEditor.formulaNeedsNumbers')} />;
  }

  return (
    <Section title={t('fieldEditor.formula')}>
      {free ? (
        <TextField
          label={t('fieldEditor.formulaFree')}
          value={formula ?? ''}
          onChangeText={onChange}
          help={status?.ok ? status.message : t('fieldEditor.formulaHelp')}
          error={status && !status.ok ? status.message : undefined}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <>
          <Text variant="label" tone="muted">
            {t('fieldEditor.formulaFirst')}
          </Text>
          <View style={styles.chips}>
            {candidates.map((f) => (
              <Chip key={f.id} label={f.name} selected={parts.left === f.name} onPress={() => update({ left: f.name })} />
            ))}
          </View>
          <Text variant="label" tone="muted">
            {t('fieldEditor.formulaOperation')}
          </Text>
          <View style={styles.chips}>
            {SIMPLE_OPERATORS.map((op) => (
              <Chip
                key={op}
                label={`${OPERATOR_SYMBOL[op]}  ${t(`operators.${op === '*' ? 'times' : op === '+' ? 'plus' : op === '-' ? 'minus' : 'divided'}`)}`}
                selected={parts.op === op}
                onPress={() => update({ op })}
              />
            ))}
          </View>
          <Text variant="label" tone="muted">
            {t('fieldEditor.formulaSecond')}
          </Text>
          <View style={styles.chips}>
            {candidates.map((f) => (
              <Chip key={f.id} label={f.name} selected={parts.right === f.name} onPress={() => update({ right: f.name })} />
            ))}
          </View>
          {parts.left && parts.op && parts.right ? (
            <Banner
              tone={status && !status.ok ? 'danger' : 'info'}
              title={`${name.trim() || t('fieldEditor.formulaResult')} = ${parts.left} ${OPERATOR_SYMBOL[parts.op]} ${parts.right}`}
              message={status && !status.ok ? status.message : undefined}
            />
          ) : null}
        </>
      )}
      <Button
        variant="ghost"
        label={free ? t('fieldEditor.formulaGuided') : t('fieldEditor.formulaWrite')}
        onPress={() => setFree((f) => !f)}
      />
    </Section>
  );
}

function Disclosure({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  const Icon = open ? CaretDownIcon : CaretRightIcon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={styles.disclosure}
    >
      <Icon size={iconSize.sm} color={colors.primary} weight="bold" />
      <Text variant="label" tone="primary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  types: { gap: spacing.sm },
  type: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 56 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  disclosure: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 },
});
