import { Pressable, StyleSheet, View } from 'react-native';

import { CaretRightIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing } from '../theme';
import { Text } from './Text';

type Props = { label: string; amount: string; percent: number; onPress?: () => void; hint?: string };

/**
 * Ligne de répartition : nom, montant et pourcentage écrits en clair, barre proportionnelle en dessous.
 * Lisible sans la couleur, et annoncée en une phrase aux lecteurs d'écran.
 */
export function ShareBar({ label, amount, percent, onPress, hint }: Props) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={styles.top}>
        <Text variant="body" style={{ flex: 1, fontFamily: 'Inter-Medium' }} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="amount" style={{ fontSize: 16 }}>
          {amount}
        </Text>
        <Text variant="label" tone="muted" style={styles.percent}>
          {percent} %
        </Text>
        {onPress ? <CaretRightIcon size={iconSize.sm} color={colors.placeholder} /> : null}
      </View>
      <View style={[styles.track, { backgroundColor: colors.neutralSoft }]}>
        <View style={[styles.fill, { width: `${Math.max(2, percent)}%`, backgroundColor: colors.expense }]} />
      </View>
    </>
  );
  const a11y = `${label} : ${amount}, ${percent} %`;
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={a11y} style={styles.row}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.neutralSoft }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 64 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  percent: { minWidth: 44, textAlign: 'right' },
  track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.pill },
});
