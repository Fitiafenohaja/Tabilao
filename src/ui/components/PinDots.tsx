import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { spacing } from '../theme';
import { useReducedMotion } from '../useReducedMotion';

type Props = {
  /** Nombre de cases affichées. */
  slots: number;
  filled: number;
  /** Change à chaque erreur pour rejouer l'animation. */
  errorKey?: number;
  error?: boolean;
  /** Ex. « 2 chiffres saisis sur 4 ». */
  accessibilityLabel: string;
};

/** Points de saisie du code. Une erreur les colore en rouge et les secoue (sauf « animations réduites »). */
export function PinDots({ slots, filled, errorKey = 0, error = false, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [shake] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!errorKey || reduced) return;
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 7, -7, 3, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 45, useNativeDriver: true })),
    ).start();
  }, [errorKey, reduced, shake]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { transform: [{ translateX: shake }] }]}
    >
      {Array.from({ length: slots }, (_, i) => {
        const on = i < filled;
        const color = error ? colors.danger : colors.primary;
        return (
          <View
            key={i}
            style={[styles.dot, { borderColor: on ? color : colors.placeholder, backgroundColor: on ? color : 'transparent' }]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, minHeight: 24, alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
});
