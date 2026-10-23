import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BackspaceIcon, type Icon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, spacing } from '../theme';
import { Text } from './Text';

type Props = {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  deleteLabel: string;
  /** Touche en bas à gauche (ex. empreinte). */
  extra?: { icon: Icon; label: string; onPress: () => void };
  disabled?: boolean;
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

/** Clavier numérique large (touches de 72 dp), utilisable d'une main. */
export function PinPad({ onDigit, onDelete, deleteLabel, extra, disabled = false }: Props) {
  const { colors } = useTheme();
  const tap = (fn: () => void) => () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

  const key = (id: string, content: ReactNode, label: string, onPress: () => void, isDisabled = disabled) => (
    <Pressable
      key={id}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={tap(onPress)}
      style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.primarySoft }, isDisabled && { opacity: 0.35 }]}
    >
      {content}
    </Pressable>
  );

  const digit = (d: string) =>
    key(
      d,
      <Text variant="display" style={styles.digit}>
        {d}
      </Text>,
      d,
      () => onDigit(d),
    );

  return (
    <View style={styles.pad}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map(digit)}
        </View>
      ))}
      <View style={styles.row}>
        {extra ? (
          key('extra', <extra.icon size={iconSize.lg} color={colors.primary} />, extra.label, extra.onPress, false)
        ) : (
          <View style={styles.key} />
        )}
        {digit('0')}
        {key('del', <BackspaceIcon size={iconSize.lg} color={colors.textMuted} />, deleteLabel, onDelete)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: spacing.md, alignSelf: 'center' },
  row: { flexDirection: 'row', gap: spacing.xl },
  key: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  digit: { fontFamily: 'Inter-Medium', fontSize: 28 },
});
