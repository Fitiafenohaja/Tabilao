import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import type { Icon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing } from '../theme';
import { Text } from './Text';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: Icon;
  loading?: boolean;
};

/** Bouton pleine largeur, 52 dp. Un seul bouton `primary` par écran ; `danger` toujours après confirmation. */
export function Button({ label, variant = 'primary', icon: IconComponent, loading = false, disabled, style, ...rest }: Props) {
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const fg = { primary: colors.onPrimary, secondary: colors.primary, danger: colors.danger, ghost: colors.primary }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={(state) => {
        const { pressed } = state;
        const base = {
          primary: { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
          secondary: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: pressed ? colors.primaryTint : 'transparent' },
          danger: { borderWidth: 1, borderColor: colors.dangerSoft, backgroundColor: pressed ? colors.dangerSoft : 'transparent' },
          ghost: { backgroundColor: pressed ? colors.primaryTint : 'transparent' },
        }[variant];
        return [styles.button, base, inactive && styles.disabled, typeof style === 'function' ? style(state) : style];
      }}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : IconComponent ? (
          <IconComponent size={iconSize.md} color={fg} weight="bold" />
        ) : null}
        <Text variant="label" style={[styles.label, { color: fg }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: radius.field, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 16, fontFamily: 'Inter-SemiBold' },
  disabled: { opacity: 0.45 },
});
