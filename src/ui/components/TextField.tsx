import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { WarningIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing, typography } from '../theme';
import { Text } from './Text';

type Props = TextInputProps & { label: string; help?: string; error?: string; required?: boolean };

/** Champ de saisie : libellé visible au-dessus, aide en dessous, erreur en rouge avec icône. */
export function TextField({ label, help, error, required = false, style, onFocus, onBlur, ...rest }: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  return (
    <View style={styles.wrapper}>
      <Text variant="label" tone="muted">
        {label}
        {required ? <Text variant="label" tone="danger"> *</Text> : null}
      </Text>
      <TextInput
        accessibilityLabel={required ? `${label}, obligatoire` : label}
        accessibilityHint={error ?? help}
        placeholderTextColor={colors.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          typography.body,
          { color: colors.text, backgroundColor: colors.card, borderColor, borderWidth: focused || error ? 2 : 1 },
          style,
        ]}
        {...rest}
      />
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
  input: { minHeight: 52, borderRadius: radius.field, paddingHorizontal: spacing.md },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
