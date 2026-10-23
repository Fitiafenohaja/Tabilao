import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { EyeIcon, EyeSlashIcon, WarningIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing, touchTarget, typography } from '../theme';
import { Text } from './Text';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
  showLabel: string;
  hideLabel: string;
  error?: string;
  help?: string;
  /** `new` : création (le gestionnaire de mots de passe peut proposer) ; `current` : saisie d'un mot existant. */
  purpose?: 'new' | 'current';
};

/** Mot de passe : bouton afficher / masquer, collage et gestionnaires de mots de passe autorisés. */
export function PasswordField({ label, showLabel, hideLabel, error, help, purpose = 'current', style, ...rest }: Props) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  return (
    <View style={styles.wrapper}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <View style={[styles.box, { backgroundColor: colors.card, borderColor, borderWidth: focused || error ? 2 : 1 }]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error ?? help}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={purpose === 'new' ? 'new-password' : 'current-password'}
          textContentType={purpose === 'new' ? 'newPassword' : 'password'}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[typography.body, styles.input, { color: colors.text }, style]}
          {...rest}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? hideLabel : showLabel}
          accessibilityState={{ selected: visible }}
          onPress={() => setVisible((v) => !v)}
          style={styles.toggle}
        >
          {visible ? (
            <EyeSlashIcon size={iconSize.md} color={colors.textMuted} />
          ) : (
            <EyeIcon size={iconSize.md} color={colors.textMuted} />
          )}
        </Pressable>
      </View>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <WarningIcon size={iconSize.sm - 4} color={colors.danger} weight="fill" />
          <Text variant="caption" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : help ? (
        <Text variant="caption" tone="muted">
          {help}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: radius.field, paddingLeft: spacing.md },
  input: { flex: 1, paddingVertical: spacing.sm },
  toggle: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
