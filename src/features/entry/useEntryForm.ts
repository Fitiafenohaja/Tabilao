import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { recordsRepo, type RecordItem } from '@/data/repositories';
import type { Field } from '@/data/schema';
import { prefillFromPrevious, repeatValues } from '@/services/entryAssist';
import { frequentEntries } from '@/services/insights';
import { computeRow, normalizeNumbers, type RecordData } from '@/services/fields';
import { initialValues, todayIso } from '@/services/tables';
import { buildZodSchema } from '@/services/validation/buildZodSchema';

import { useDbQuery } from '../useDbQuery';

/**
 * Formulaire de saisie : validation Zod générée, calcul en direct, enregistrement transactionnel.
 * Avec `existing`, le formulaire est prérempli et l'enregistrement modifie la ligne (règles entre tableaux recalculées).
 */
export function useEntryForm(tableId: string, fields: readonly Field[], existing?: RecordItem) {
  const schema = useMemo(() => buildZodSchema(fields), [fields]);
  const defaults = useMemo(() => existing?.data ?? initialValues(fields), [existing, fields]);

  const form = useForm<RecordData>({ resolver: zodResolver(schema) as never, defaultValues: defaults, mode: 'onBlur' });
  const values = useWatch({ control: form.control }) as RecordData;
  const computed = useMemo(() => computeRow(fields, normalizeNumbers(fields, values)), [fields, values]);

  const save = (onSaved?: () => void) => () =>
    void form.handleSubmit((data) => {
      const row = computeRow(fields, data).data;
      if (existing) {
        // Les valeurs de champs supprimés depuis sont conservées ; un champ vidé redevient vide.
        const ids = new Set(fields.map((f) => f.id));
        const kept = Object.fromEntries(Object.entries(existing.data).filter(([id]) => !ids.has(id)));
        recordsRepo.update(existing.id, { ...kept, ...row });
      } else recordsRepo.insert(tableId, row);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!existing) form.reset(defaults);
      onSaved?.();
    })();

  /** Dernière ligne du tableau, pour « Reprendre la dernière saisie » (nouvelle saisie seulement). */
  const last = useDbQuery(() => (existing ? undefined : recordsRepo.last(tableId)), [existing, tableId]);

  /** Saisies habituelles (loyer, transport, produit vendu au même prix…) parmi les 200 dernières. */
  const frequent = useDbQuery(
    () => (existing ? [] : frequentEntries(fields, recordsRepo.list(tableId, { limit: 200 }).map((r) => r.data))),
    [existing, tableId, fields],
  );

  /** Remplit le formulaire à partir d'une ligne passée, datée d'aujourd'hui. */
  const applyEntry = (data: RecordData) =>
    form.reset({ ...defaults, ...repeatValues(fields, data, todayIso()) }, { keepDefaultValues: true });

  const repeatLast = () => {
    if (last) applyEntry(last.data);
  };

  /** Valeur connue choisie (ex. un produit déjà vendu) : on reprend son prix et son unité de la dernière fois. */
  const pickKnownValue = (fieldId: string, value: string) => {
    form.setValue(fieldId, value, { shouldDirty: true });
    const previous = recordsRepo.lastWhere(tableId, fieldId, value);
    if (!previous) return;
    const patch = prefillFromPrevious(fields, previous.data, form.getValues(), fieldId);
    for (const [id, v] of Object.entries(patch)) form.setValue(id, v, { shouldDirty: true });
  };

  return { form, values, computed, save, last, repeatLast, frequent, applyEntry, pickKnownValue };
}
