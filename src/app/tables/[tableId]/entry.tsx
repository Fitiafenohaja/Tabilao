import { router, Stack, useLocalSearchParams, useNavigation, usePreventRemove } from 'expo-router';
import { Controller, type ControllerRenderProps } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { recordsRepo, type RecordItem } from '@/data/repositories';
import type { Field } from '@/data/schema';
import { usePhotoPicker } from '@/features/entry/usePhotoPicker';
import { useEntryForm } from '@/features/entry/useEntryForm';
import { useSuggestions } from '@/features/entry/useSuggestions';
import { useTable } from '@/features/tables/useTables';
import { useDbQuery } from '@/features/useDbQuery';
import { fieldOptions, fieldValidation, unitFor, type RecordData } from '@/services/fields';
import { formatAmount } from '@/services/money';
import { filterFieldOf } from '@/services/sorting';
import { amountFieldOf, titleFieldOf } from '@/services/summary';
import { discardPhoto } from '@/services/photos';
import { addChoice } from '@/services/tables';
import {
  Button,
  CheckIcon,
  Chip,
  ArrowsClockwiseIcon,
  ComputedField,
  DateField,
  EraserIcon,
  IconButton,
  ListRow,
  Section,
  Sheet,
  SuggestionChips,
  EmptyState,
  FloppyDiskIcon,
  PhotoField,
  PlusIcon,
  QuantityField,
  Screen,
  TableIcon,
  Text,
  TextField,
  WarningIcon,
  spacing,
  useTheme,
  useToast,
} from '@/ui';

// Saisie rapide (parcours en 3 gestes) ; avec `recordId`, modification d'une ligne existante.
export default function Entry() {
  const { tableId, recordId } = useLocalSearchParams<{ tableId: string; recordId?: string }>();
  const { fields } = useTable(tableId);
  const existing = useDbQuery(() => (recordId ? recordsRepo.get(recordId) : undefined), [recordId]);
  if (recordId && !existing) return null;
  if (fields.length === 0) return <NoFields tableId={tableId} />;
  return <EntryForm key={existing?.id ?? 'new'} tableId={tableId} fields={fields} existing={existing} />;
}

function EntryForm({ tableId, fields, existing }: { tableId: string; fields: Field[]; existing?: RecordItem }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { form, values, computed, save, last, repeatLast, frequent, applyEntry, pickKnownValue } = useEntryForm(tableId, fields, existing);
  const errors = form.formState.errors;
  const dirty = form.formState.isDirty;
  const editing = !!existing;
  const navigation = useNavigation();

  const onSaved = (next: boolean) => {
    toast.show(editing ? t('records.updated') : t('entry.saved'));
    if (!next) {
      // Saisie enregistrée : plus rien à perdre, la garde de sortie laisse passer.
      form.reset(form.getValues());
      router.back();
    }
  };
  const saveAndClose = save(() => onSaved(false));
  const saveAndNext = save(() => onSaved(true));

  // Retour en arrière avec une saisie en cours : on demande avant de tout perdre.
  usePreventRemove(dirty, ({ data }) => {
    if (!form.formState.isDirty) return navigation.dispatch(data.action);
    Alert.alert(t('entry.discardTitle'), t('entry.discardMessage'), [
      { text: t('entry.keepEditing'), style: 'cancel' },
      { text: t('entry.discard'), style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const confirmClear = () =>
    Alert.alert(t('entry.clearTitle'), t('entry.resetConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.clear'), style: 'destructive', onPress: () => form.reset() },
    ]);

  // Résumé lisible d'une ligne : « Savon Nosy · 4 500 Ar », « Loyer · 150 000 Ar ».
  const titleField = titleFieldOf(fields);
  const categoryField = filterFieldOf(fields);
  const amountField = amountFieldOf(fields);
  const describe = (data: RecordData) =>
    [
      titleField && data[titleField.id] ? String(data[titleField.id]) : '',
      categoryField && categoryField !== titleField && data[categoryField.id] ? String(data[categoryField.id]) : '',
      amountField && typeof data[amountField.id] === 'number' ? formatAmount(Math.round(data[amountField.id] as number)) : '',
    ]
      .filter(Boolean)
      .join(' · ');
  const lastSummary = last ? describe(last.data) : '';

  return (
    <Screen
      footer={
        editing ? (
          <Button icon={FloppyDiskIcon} label={t('common.save')} onPress={saveAndClose} />
        ) : (
          <>
            <Button variant="secondary" icon={PlusIcon} label={t('common.saveAndNext')} onPress={saveAndNext} />
            <Button icon={FloppyDiskIcon} label={t('common.save')} onPress={saveAndClose} />
          </>
        )
      }
    >
      <Stack.Screen
        options={{
          title: editing ? t('records.editTitle') : t('entry.title'),
          headerRight: () =>
            dirty ? <IconButton icon={EraserIcon} label={t('entry.clearTitle')} onPress={confirmClear} /> : null,
        }}
      />
      {last && !dirty ? (
        <Section flush>
          <ListRow
            icon={ArrowsClockwiseIcon}
            iconBg="primarySoft"
            iconFg="onPrimarySoft"
            title={t('entry.repeatLast')}
            subtitle={lastSummary || undefined}
            onPress={repeatLast}
          />
        </Section>
      ) : null}
      {frequent.length > 0 && !dirty ? (
        <Section title={t('entry.frequent')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {frequent.map((data, i) => (
              <Chip
                key={i}
                icon={ArrowsClockwiseIcon}
                label={describe(data)}
                accessibilityLabel={`${t('entry.frequent')} : ${describe(data)}`}
                onPress={() => applyEntry(data)}
              />
            ))}
          </View>
        </Section>
      ) : null}
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
        return (
          <Controller
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: input }) => (
              <FieldInput
                tableId={tableId}
                onPickKnown={editing ? undefined : pickKnownValue}
                field={field}
                fields={fields}
                values={values}
                saved={existing?.data[field.id]}
                input={input}
                error={errors[field.id]?.message as string | undefined}
              />
            )}
          />
        );
      })}
    </Screen>
  );
}

type InputProps = {
  tableId: string;
  /** Choix d'une valeur déjà connue : préremplit prix et unité (nouvelle saisie seulement). */
  onPickKnown?: (fieldId: string, value: string) => void;
  field: Field;
  fields: Field[];
  values: RecordData;
  /** Valeur enregistrée (modification d'une ligne). */
  saved?: RecordData[string];
  input: ControllerRenderProps<RecordData, string>;
  error?: string;
};

/** Le bon contrôle pour chaque type de champ : rien à taper quand on peut l'éviter. */
function FieldInput({ tableId, onPickKnown, field, fields, values, saved, input, error }: InputProps) {
  const { t } = useTranslation();
  const photos = usePhotoPicker();
  const [adding, setAdding] = useState(false);

  switch (field.type) {
    case 'choice':
    case 'boolean':
      return (
        <View style={{ gap: spacing.xs }}>
          {field.type === 'choice' && adding ? (
            <AddChoiceSheet
              visible
              fieldName={field.name}
              onClose={() => setAdding(false)}
              onAdd={(value) => {
                const added = addChoice(field.id, value);
                if (added) input.onChange(added);
                setAdding(false);
              }}
            />
          ) : null}
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
            {field.type === 'choice' ? (
              <Chip
                icon={PlusIcon}
                label={t('entry.addChoice')}
                accessibilityLabel={t('entry.addChoiceTo', { field: field.name })}
                onPress={() => setAdding(true)}
              />
            ) : null}
          </View>
          {error ? <FieldError message={error} /> : null}
        </View>
      );
    case 'number':
      return (
        <QuantityField
          label={field.name}
          required={field.required}
          value={input.value}
          onChange={input.onChange}
          onBlur={input.onBlur}
          unit={unitFor(field, fields, values)}
          integerOnly={fieldValidation(field).decimals === 0}
          min={fieldValidation(field).min}
          error={error}
          help={fieldValidation(field).decimals === 0 ? undefined : t('quantity.hint')}
          decreaseLabel={t('quantity.decrease', { field: field.name })}
          increaseLabel={t('quantity.increase', { field: field.name })}
        />
      );
    case 'date':
      return (
        <DateField
          label={field.name}
          required={field.required}
          value={input.value}
          onChange={input.onChange}
          error={error}
          labels={{ choose: t('dates.choose'), today: t('filters.today'), yesterday: t('dates.yesterday') }}
        />
      );
    case 'photo': {
      // Une photo prise pendant cette saisie puis remplacée ou retirée est supprimée du téléphone ;
      // celle déjà liée à la ligne enregistrée est gardée (la ligne peut revenir de la corbeille).
      const change = (uri: string | null) => {
        if (typeof input.value === 'string' && input.value !== saved) discardPhoto(input.value);
        input.onChange(uri);
      };
      const take = async (source: 'camera' | 'gallery') => {
        const uri = source === 'camera' ? await photos.takePhoto() : await photos.pickPhoto();
        if (uri) change(uri);
      };
      return (
        <PhotoField
          label={field.name}
          required={field.required}
          value={input.value}
          busy={photos.busy}
          error={photos.denied ? t('photo.denied') : error}
          onCamera={() => void take('camera')}
          onGallery={() => void take('gallery')}
          onRemove={() => change(null)}
          labels={{ camera: t('photo.camera'), gallery: t('photo.gallery'), remove: t('photo.remove'), preview: t('photo.preview') }}
        />
      );
    }
    case 'text':
      return (
        <TextWithSuggestions
          tableId={tableId}
          field={field}
          value={input.value === null || input.value === undefined ? '' : String(input.value)}
          onChange={input.onChange}
          onBlur={input.onBlur}
          onPick={(value) => (onPickKnown ? onPickKnown(field.id, value) : input.onChange(value))}
          error={error}
        />
      );
    default:
      return (
        <TextField
          label={field.name}
          required={field.required}
          value={input.value === null || input.value === undefined ? '' : String(input.value)}
          onChangeText={input.onChange}
          onBlur={input.onBlur}
          keyboardType={field.type === 'money' ? 'numeric' : 'default'}
          error={error}
        />
      );
  }
}

/** Nouvelle valeur pour une liste (ex. une catégorie de dépense), ajoutée sans quitter la saisie. */
function AddChoiceSheet({ visible, fieldName, onClose, onAdd }: { visible: boolean; fieldName: string; onClose: () => void; onAdd: (value: string) => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const submit = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue('');
  };
  return (
    <Sheet visible={visible} title={t('entry.addChoiceTo', { field: fieldName })} closeLabel={t('common.close')} onClose={onClose}>
      <TextField label={t('entry.newChoice')} value={value} onChangeText={setValue} onSubmitEditing={submit} autoFocus />
      <Text variant="caption" tone="muted">
        {t('entry.newChoiceHint')}
      </Text>
      <Button icon={PlusIcon} label={t('entry.addChoice')} disabled={!value.trim()} onPress={submit} />
    </Sheet>
  );
}

/** Texte avec les valeurs déjà saisies proposées en dessous (produits, clients…). */
function TextWithSuggestions({
  tableId,
  field,
  value,
  onChange,
  onBlur,
  onPick,
  error,
}: {
  tableId: string;
  field: Field;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onPick: (value: string) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const suggestions = useSuggestions(tableId, field.id, value);
  return (
    <View style={{ gap: spacing.sm }}>
      <TextField label={field.name} required={field.required} value={value} onChangeText={onChange} onBlur={onBlur} error={error} />
      <SuggestionChips suggestions={suggestions} onPick={onPick} labelPrefix={t('entry.suggestion')} />
    </View>
  );
}

/** Saisie impossible sans champ : on envoie vers l'éditeur plutôt qu'un écran blanc. */
function NoFields({ tableId }: { tableId: string }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState
        icon={TableIcon}
        title={t('fieldEditor.emptyTitle')}
        message={t('fieldEditor.emptyMessage')}
        actionLabel={t('fieldEditor.addFields')}
        onAction={() => router.replace({ pathname: '/tables/[tableId]/edit', params: { tableId } })}
      />
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
