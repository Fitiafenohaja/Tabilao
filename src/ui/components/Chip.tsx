import { Pressable, StyleSheet } from 'react-native';

import type { Icon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing, touchTarget } from '../theme';
import { Text } from './Text';

type Props = { label: string; selected?: boolean; onPress?: () => void; icon?: Icon; accessibilityLabel?: string };

/** Puce de sélection rapide (filtres, choix de liste). L'état sélectionné n'est pas porté par la couleur seule. */
export function Chip({ label, selected = false, onPress, icon: IconComponent, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimarySoft : colors.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primarySoft : pressed ? colors.neutralSoft : colors.card,
        },
      ]}
    >
      {IconComponent ? <IconComponent size={iconSize.sm} color={fg} weight={selected ? 'bold' : 'regular'} /> : null}
      <Text variant="label" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTarget - 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
