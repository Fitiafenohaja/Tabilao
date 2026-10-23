import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text, spacing, useTheme } from '@/ui';

import type { WizardStep } from '../importStore';

const STEPS: WizardStep[] = ['file', 'mapping', 'check', 'report'];

/** Progression de l'assistant : « Étape 2 sur 4 · Associer les colonnes » + barre segmentée. */
export function StepIndicator({ step }: { step: WizardStep }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const index = STEPS.indexOf(step);
  return (
    <View style={[styles.box, { backgroundColor: colors.background }]} accessible accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: STEPS.length, now: index + 1 }}>
      <Text variant="caption" tone="muted">
        {t('import.stepOf', { step: index + 1, total: STEPS.length })} · {t(`import.steps.${step}`)}
      </Text>
      <View style={styles.bars}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.bar, { backgroundColor: i <= index ? colors.primary : colors.border }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  bars: { flexDirection: 'row', gap: spacing.xs },
  bar: { flex: 1, height: 4, borderRadius: 2 },
});
