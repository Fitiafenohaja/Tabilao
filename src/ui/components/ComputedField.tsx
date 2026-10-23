import { StyleSheet, View } from 'react-native';

import { CalculatorIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing } from '../theme';
import { Text } from './Text';

type Props = { label: string; value: string; error?: string };

/** Champ calculé : fond vert pâle, icône calculatrice, non éditable. */
export function ComputedField({ label, value, error }: Props) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label} : ${error ?? value}`}
      style={[styles.box, { backgroundColor: error ? colors.dangerSoft : colors.primaryTint, borderColor: error ? colors.danger : colors.primarySoft }]}
    >
      <View style={styles.label}>
        <CalculatorIcon size={iconSize.sm} color={error ? colors.onDangerSoft : colors.onPrimarySoft} />
        <Text variant="label" tone="muted">
          {label}
        </Text>
      </View>
      {error ? (
        <Text variant="caption" style={{ color: colors.onDangerSoft, flexShrink: 1, textAlign: 'right' }}>
          {error}
        </Text>
      ) : (
        <Text variant="amount" style={{ color: colors.onPrimarySoft }}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.field,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 52,
  },
  label: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
