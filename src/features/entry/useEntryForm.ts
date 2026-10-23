import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { recordsRepo, type RecordItem } from '@/data/repositories';
import type { Field } from '@/data/schema';
import { computeRow, normalizeNumbers, type RecordData } from '@/services/fields';
import { initialValues } from '@/services/tables';
import { buildZodSchema } from '@/services/validation/buildZodSchema';

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

  return { form, values, computed, save };
}
