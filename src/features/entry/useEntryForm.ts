import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { recordsRepo } from '@/data/repositories';
import type { Field } from '@/data/schema';
import { computeRow, normalizeNumbers, type RecordData } from '@/services/fields';
import { initialValues } from '@/services/tables';
import { buildZodSchema } from '@/services/validation/buildZodSchema';

/** Formulaire de saisie rapide : validation Zod générée, calcul en direct, enregistrement transactionnel. */
export function useEntryForm(tableId: string, fields: readonly Field[]) {
  const schema = useMemo(() => buildZodSchema(fields), [fields]);
  const defaults = useMemo(() => initialValues(fields), [fields]);

  const form = useForm<RecordData>({ resolver: zodResolver(schema) as never, defaultValues: defaults, mode: 'onBlur' });
  const values = useWatch({ control: form.control }) as RecordData;
  const computed = useMemo(() => computeRow(fields, normalizeNumbers(fields, values)), [fields, values]);

  const save = (onSaved?: () => void) => () =>
    void form.handleSubmit((data) => {
      recordsRepo.insert(tableId, computeRow(fields, data).data);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      form.reset(defaults);
      onSaved?.();
    })();

  return { form, values, computed, save };
}
