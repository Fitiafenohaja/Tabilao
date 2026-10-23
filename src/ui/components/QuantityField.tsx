import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { parseQuantity, stepQuantity } from '@/services/quantity';

import { MinusIcon, PlusIcon, WarningIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing, typography } from '../theme';
import { Text } from './Text';

type Props = {
  label: string;
  value: unknown;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  unit?: string | null;
  integerOnly?: boolean;
  min?: number;
  required?: boolean;
  error?: string;
  help?: string;
  decreaseLabel: string;
  increaseLabel: string;
};

/**
 * Quantité : saisie libre (« 1,5 », « 1/2 ») ou boutons − / + de 52 dp.
 * L'unité est affichée dans le champ : l'utilisateur ne la tape pas.
 */
export function QuantityField({
  label,
  value,
  onChange,
  onBlur,
  unit,
  integerOnly = false,
  min,
  required = false,
  error,
  help,
  decreaseLabel,
  increaseLabel,
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const text = value === null || value === undefined ? '' : typeof value === 'number' ? String(value).replace('.', ',') : String(value);
  const parsed = parseQuantity(text);
  const current = parsed.ok ? parsed.value : null;
  const atMin = min !== undefined && current !== null && current <= min;

  const step = (direction: 1 | -1) => onChange(stepQuantity(current, direction, min));

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text variant="label" tone="muted">
        {label}
        {required ? <Text variant="label" tone="danger"> *</Text> : null}
      </Text>
      <View style={styles.row}>
        <StepButton icon="minus" label={decreaseLabel} disabled={atMin} onPress={() => step(-1)} />
        <View
          style={[
            styles.inputBox,
            { backgroundColor: colors.card, borderColor, borderWidth: focused || error ? 2 : 1 },
          ]}
        >
          <TextInput
            accessibilityLabel={required ? `${label}, obligatoire${unit ? `, en ${unit}` : ''}` : `${label}${unit ? `, en ${unit}` : ''}`}
            accessibilityHint={error ?? help}
            value={text}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            keyboardType={integerOnly ? 'number-pad' : 'decimal-pad'}
            selectTextOnFocus
            style={[typography.amount, styles.input, { color: colors.text }]}
          />
          {unit ? (
            <Text variant="body" tone="muted" accessibilityElementsHidden importantForAccessibility="no">
              {unit}
            </Text>
          ) : null}
        </View>
        <StepButton icon="plus" label={increaseLabel} onPress={() => step(1)} />
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

function StepButton({ icon, label, onPress, disabled = false }: { icon: 'minus' | 'plus'; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  const Icon = icon === 'minus' ? MinusIcon : PlusIcon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: pressed ? colors.primarySoft : colors.primaryTint, borderColor: colors.primarySoft },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Icon size={iconSize.md} color={colors.onPrimarySoft} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.field,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: { flex: 1, textAlign: 'center', paddingVertical: spacing.sm },
  step: { width: 52, height: 52, borderRadius: radius.field, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
