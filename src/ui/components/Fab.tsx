import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlusIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { elevation, iconSize, radius, spacing } from '../theme';
import { Text } from './Text';

type Props = { label: string; onPress: () => void };

/** Bouton flottant « + Saisie » (écrans sans barre de navigation), en bas à droite, au-dessus de la zone de geste. */
export function Fab({ label, onPress }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: spacing.xl + insets.bottom, backgroundColor: pressed ? colors.primaryPressed : colors.primary },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <PlusIcon size={iconSize.md} color={colors.onPrimary} weight="bold" />
      <Text variant="heading" style={{ color: colors.onPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.fab,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...elevation.fab,
  },
});
