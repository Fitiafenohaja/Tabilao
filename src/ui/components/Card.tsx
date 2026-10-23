import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { elevation, radius, spacing } from '../theme';

type Props = ViewProps & { onPress?: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle> };

/** Carte blanche, bordure fine ; pressable avec léger enfoncement (sans décalage de mise en page). */
export function Card({ style, onPress, children, accessibilityLabel, ...rest }: Props) {
  const { colors } = useTheme();
  const base = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [...base, pressed && { transform: [{ scale: 0.985 }], backgroundColor: colors.primaryTint }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[...base, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, padding: spacing.lg, gap: spacing.sm, ...elevation.card },
});
