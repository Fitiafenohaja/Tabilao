import { Pressable, StyleSheet } from 'react-native';

import type { Icon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, touchTarget } from '../theme';

type Props = {
  icon: Icon;
  /** Nom accessible obligatoire : le bouton n'a pas de texte visible. */
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
};

/** Bouton icône 48 × 48 dp avec retour visuel au toucher. */
export function IconButton({ icon: IconComponent, label, onPress, tone = 'default', disabled = false }: Props) {
  const { colors } = useTheme();
  const color = { default: colors.text, primary: colors.primary, danger: colors.danger }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.neutralSoft }, disabled && { opacity: 0.3 }]}
    >
      <IconComponent size={iconSize.md} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: touchTarget, height: touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
