import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, StyleSheet, View } from 'react-native';

import { recordsRepo } from '@/data/repositories';
import { useTable } from '@/features/tables/useTables';
import { useDbQuery } from '@/features/useDbQuery';
import { formatDate } from '@/i18n/format';
import { unitFor } from '@/services/fields';
import { formatAmount } from '@/services/money';
import { formatQuantity } from '@/services/quantity';
import { amountFieldOf, titleFieldOf } from '@/services/summary';
import {
  Button,
  CalculatorIcon,
  Card,
  CopyIcon,
  PencilSimpleIcon,
  Screen,
  Section,
  Text,
  TrashIcon,
  iconSize,
  spacing,
  useTheme,
  useToast,
} from '@/ui';

// Détail d'un enregistrement : valeurs, dupliquer, supprimer (corbeille 30 jours).
export default function RecordDetail() {
  const { tableId, recordId } = useLocalSearchParams<{ tableId: string; recordId: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const { fields } = useTable(tableId);
  const record = useDbQuery(() => recordsRepo.get(recordId), [recordId]);
  const roles = useMemo(() => ({ title: titleFieldOf(fields), amount: amountFieldOf(fields) }), [fields]);
  if (!record) return null;

  const show = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId)!;
    const v = record.data[fieldId];
    if (v === null || v === undefined || v === '') return '—';
    if (field.type === 'number' && typeof v === 'number') return formatQuantity(v, unitFor(field, fields, record.data));
    if ((field.type === 'money' || field.type === 'formula') && typeof v === 'number') return formatAmount(Math.round(v));
    if (field.type === 'date' && typeof v === 'string') return formatDate(v);
    if (typeof v === 'boolean') return v ? t('common.yes') : t('common.no');
    return String(v);
  };

  const confirmDelete = () =>
    Alert.alert(t('common.delete'), t('records.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          recordsRepo.softDelete([recordId]);
          toast.show(t('records.deleted'), 'success', { label: t('common.undo'), onPress: () => recordsRepo.restore([recordId]) });
          router.back();
        },
      },
    ]);

  return (
    <Screen
      footer={
        <>
          <Button
            icon={PencilSimpleIcon}
            label={t('common.edit')}
            onPress={() => router.push({ pathname: '/tables/[tableId]/entry', params: { tableId, recordId } })}
          />
          <Button
            variant="secondary"
            icon={CopyIcon}
            label={t('common.duplicate')}
            onPress={() => {
              recordsRepo.insert(tableId, record.data);
              toast.show(t('entry.saved'));
            }}
          />
          <Button variant="danger" icon={TrashIcon} label={t('common.delete')} onPress={confirmDelete} />
        </>
      }
    >
      <Stack.Screen options={{ title: t('records.details') }} />
      <View style={styles.hero}>
        <Text variant="title">{roles.title ? show(roles.title.id) : t('records.details')}</Text>
        {roles.amount ? (
          <Text variant="display" tone="primary">
            {show(roles.amount.id)}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {t('records.createdAt', { date: formatDate(record.createdAt, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) })}
        </Text>
      </View>

      {fields
        .filter((f) => f.type === 'photo' && typeof record.data[f.id] === 'string' && record.data[f.id])
        .map((f) => (
          <View key={f.id} style={[styles.photo, { borderColor: colors.border }]}>
            <Image
              source={{ uri: record.data[f.id] as string }}
              style={styles.image}
              resizeMode="cover"
              accessibilityLabel={`${f.name} : ${t('photo.preview')}`}
            />
          </View>
        ))}

      <Section>
        <Card style={styles.list}>
          {fields.filter((f) => f.type !== 'photo').map((f, i) => (
            <View
              key={f.id}
              accessible
              accessibilityLabel={`${f.name} : ${show(f.id)}`}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
            >
              <View style={styles.label}>
                {f.type === 'formula' ? <CalculatorIcon size={iconSize.sm} color={colors.onPrimarySoft} /> : null}
                <Text variant="label" tone="muted">
                  {f.name}
                </Text>
              </View>
              <Text variant={f.type === 'money' || f.type === 'formula' ? 'amount' : 'body'} style={styles.value}>
                {show(f.id)}
              </Text>
            </View>
          ))}
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.xs, paddingTop: spacing.sm },
  list: { paddingVertical: 0, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 52, paddingVertical: spacing.sm },
  label: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  value: { flexShrink: 1, textAlign: 'right' },
  photo: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 4 / 3 },
});
