import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { FieldType } from '@/data/schema';
import {
  defaultSelection,
  FIELD_PRESETS,
  SUGGESTIONS,
  selectedColumns,
  toggleColumn,
  type FieldPresetId,
  type TableCategory,
} from '@/services/fieldPresets';
import { FieldDefinitionError } from '@/services/fieldRules';
import { createCustomTable } from '@/services/tables';
import type { TemplateField } from '@/templates';
import {
  Banner,
  Button,
  CheckCircleIcon,
  CheckIcon,
  Chip,
  IconButton,
  IconTile,
  PlusIcon,
  Screen,
  Section,
  Text,
  TextField,
  XIcon,
  categoryVisual,
  iconSize,
  spacing,
  touchTarget,
  useTheme,
  useToast,
} from '@/ui';

const CATEGORIES: TableCategory[] = ['income', 'expense', 'stock', 'other'];
const CUSTOM_TYPES: FieldType[] = ['text', 'number', 'money', 'date', 'boolean'];

// Créer un tableau sur mesure en 2 étapes : (1) nom et ce qu'il suit, (2) colonnes déjà cochées.
export default function CreateTable() {
  const { t } = useTranslation();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TableCategory>('income');
  const [selected, setSelected] = useState<Set<FieldPresetId>>(() => defaultSelection('income'));
  const [custom, setCustom] = useState<TemplateField[]>([]);
  const [error, setError] = useState<string | null>(null);

  const nameOf = (id: FieldPresetId) => t(`presets.${id}`);
  const count = selected.size + custom.length;

  const chooseCategory = (c: TableCategory) => {
    setCategory(c);
    setSelected(defaultSelection(c));
  };

  const create = () => {
    try {
      const table = createCustomTable(name, category, [...selectedColumns(category, selected, nameOf), ...custom]);
      toast.show(t('create.done'));
      router.replace({ pathname: '/tables/[tableId]', params: { tableId: table.id } });
    } catch (e) {
      setError(e instanceof FieldDefinitionError ? e.message : t('errors.generic'));
    }
  };

  return (
    <Screen
      footer={
        step === 1 ? (
          <Button label={t('common.next')} disabled={!name.trim()} onPress={() => setStep(2)} />
        ) : (
          <>
            <Button
              icon={PlusIcon}
              label={t('create.submit', { count })}
              disabled={count === 0}
              onPress={create}
            />
            <Button variant="ghost" label={t('common.back')} onPress={() => setStep(1)} />
          </>
        )
      }
    >
      <Stack.Screen options={{ title: t('create.title') }} />
      <Text variant="caption" tone="muted">
        {t('import.stepOf', { step, total: 2 })}
      </Text>

      {step === 1 ? (
        <>
          <TextField
            label={t('create.nameQuestion')}
            placeholder={t('tables.namePlaceholder')}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Section title={t('create.whatQuestion')}>
            {CATEGORIES.map((c) => (
              <CategoryOption key={c} category={c} selected={category === c} onPress={() => chooseCategory(c)} />
            ))}
          </Section>
        </>
      ) : (
        <>
          <View style={{ gap: spacing.xs }}>
            <Text variant="title">{t('create.columnsQuestion')}</Text>
            <Text tone="muted">{t('create.columnsHint')}</Text>
          </View>
          {error ? <Banner tone="danger" title={error} /> : null}

          <View style={styles.list}>
            {SUGGESTIONS[category].map(({ id }) => (
              <ColumnOption
                key={id}
                label={nameOf(id)}
                hint={id === 'total' ? t('create.totalHint', { quantity: nameOf('quantity'), price: nameOf('price') }) : t(`typeHints.${presetType(id)}`)}
                checked={selected.has(id)}
                onPress={() => setSelected((s) => toggleColumn(s, id))}
              />
            ))}
            {custom.map((c, i) => (
              <ColumnOption
                key={`custom-${i}`}
                label={c.name}
                hint={t(`typeHints.${c.type}`)}
                checked
                onRemove={() => setCustom((list) => list.filter((_, j) => j !== i))}
                removeLabel={`${t('common.delete')} ${c.name}`}
              />
            ))}
          </View>

          <CustomColumn onAdd={(column) => setCustom((list) => [...list, column])} />
        </>
      )}
    </Screen>
  );
}

const presetType = (id: FieldPresetId): FieldType => FIELD_PRESETS[id].type;

function CategoryOption({ category, selected, onPress }: { category: TableCategory; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const visual = categoryVisual(category === 'other' ? null : category);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${t(`tables.category.${category}`)}. ${t(`create.categoryHint.${category}`)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? colors.primaryTint : pressed ? colors.neutralSoft : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <IconTile icon={visual.icon} bg={visual.bg} fg={visual.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="heading">{t(`tables.category.${category}`)}</Text>
        <Text variant="caption" tone="muted">
          {t(`create.categoryHint.${category}`)}
        </Text>
      </View>
      {selected ? <CheckCircleIcon size={iconSize.lg} color={colors.primary} weight="fill" /> : null}
    </Pressable>
  );
}

type ColumnOptionProps = {
  label: string;
  hint: string;
  checked: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
};

/** Colonne proposée : un toucher coche ou décoche (case à cocher accessible). */
function ColumnOption({ label, hint, checked, onPress, onRemove, removeLabel }: ColumnOptionProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.column, { backgroundColor: colors.card, borderColor: checked ? colors.primary : colors.border }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={`${label}. ${hint}`}
        disabled={!onPress}
        onPress={onPress}
        style={styles.columnMain}
      >
        <View
          style={[
            styles.box,
            { borderColor: checked ? colors.primary : colors.placeholder, backgroundColor: checked ? colors.primary : 'transparent' },
          ]}
        >
          {checked ? <CheckIcon size={iconSize.sm} color={colors.onPrimary} weight="bold" /> : null}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="body" style={{ fontFamily: 'Inter-Medium' }}>
            {label}
          </Text>
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        </View>
      </Pressable>
      {onRemove ? <IconButton icon={XIcon} label={removeLabel ?? ''} onPress={onRemove} /> : null}
    </View>
  );
}

/** Ajouter une colonne qui n'est pas dans la liste : un nom et un type, rien de plus. */
function CustomColumn({ onAdd }: { onAdd: (column: TemplateField) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');

  if (!open) return <Button variant="secondary" icon={PlusIcon} label={t('create.addOther')} onPress={() => setOpen(true)} />;

  return (
    <Section title={t('create.addOther')}>
      <TextField label={t('create.columnName')} value={label} onChangeText={setLabel} autoFocus />
      <View style={styles.chips}>
        {CUSTOM_TYPES.map((ty) => (
          <Chip key={ty} label={t(`fieldTypes.${ty}`)} selected={type === ty} onPress={() => setType(ty)} />
        ))}
      </View>
      <Text variant="caption" tone="muted">
        {t(`typeHints.${type}`)}
      </Text>
      <Button
        icon={PlusIcon}
        label={t('create.addColumn')}
        disabled={!label.trim()}
        onPress={() => {
          onAdd({ name: label.trim(), type, defaultValue: type === 'date' ? '@today' : undefined });
          setLabel('');
          setType('text');
          setOpen(false);
        }}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 16, padding: spacing.md, minHeight: 72 },
  list: { gap: spacing.sm },
  column: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingRight: spacing.xs },
  columnMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, minHeight: touchTarget + 8 },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
