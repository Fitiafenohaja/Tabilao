import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PIN_MAX, PIN_MIN } from '@/services/security';
import { Button, PinDots, PinPad, Text, spacing } from '@/ui';

type Props = {
  title: string;
  hint?: string;
  error?: string | null;
  /** Erreur à rejouer (secousse) : incrémenter à chaque échec. */
  errorKey?: number;
  /** Longueur connue (vérification) : validation automatique. Sinon 4 à 6 chiffres + « Continuer ». */
  length?: number;
  onComplete: (pin: string) => void;
};

/**
 * Saisie d'un code, partagée par la création, la confirmation et la vérification.
 * Le parent la remonte (`key`) après une erreur pour repartir d'une saisie vide.
 */
export function PinEntry({ title, hint, error, errorKey = 0, length, onComplete }: Props) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const max = length ?? PIN_MAX;

  const onDigit = (d: string) => {
    if (pin.length >= max) return;
    const next = pin + d;
    setPin(next);
    if (length && next.length === length) onComplete(next);
  };

  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <Text variant="title" accessibilityRole="header" style={styles.center}>
          {title}
        </Text>
        <Text tone={error ? 'danger' : 'muted'} accessibilityLiveRegion="polite" style={[styles.center, styles.message]}>
          {error ?? hint ?? ''}
        </Text>
        <PinDots
          slots={length ?? Math.max(PIN_MIN, Math.min(pin.length + (pin.length < PIN_MAX ? 1 : 0), PIN_MAX))}
          filled={pin.length}
          errorKey={errorKey}
          error={!!error}
          accessibilityLabel={t('security.dotsLabel', { filled: pin.length, total: length ?? PIN_MAX })}
        />
      </View>
      <PinPad onDigit={onDigit} onDelete={() => setPin((p) => p.slice(0, -1))} deleteLabel={t('common.clear')} />
      {length ? null : (
        <Button label={t('common.next')} disabled={pin.length < PIN_MIN} onPress={() => onComplete(pin)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'space-between', gap: spacing.xl, paddingVertical: spacing.lg },
  head: { alignItems: 'center', gap: spacing.md },
  center: { textAlign: 'center' },
  message: { minHeight: 48 },
});
