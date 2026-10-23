import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  attemptsLeft,
  authenticateBiometric,
  biometricAvailable,
  failures,
  isBiometricEnabled,
  lockedUntil,
  pinLength,
  tryUnlock,
} from '@/services/security';
import { Button, FingerprintIcon, LockKeyIcon, PinDots, PinPad, Text, TricolorBand, IconTile, spacing, useTheme } from '@/ui';

import { useLock } from './lockStore';

/** Écran de déverrouillage : code à 4–6 chiffres ou empreinte. Recouvre l'application sans la démonter. */
export function LockScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { unlock, setBusy } = useLock();
  const length = pinLength() ?? 4;
  const [pin, setPin] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [until, setUntil] = useState(lockedUntil);
  const [now, setNow] = useState(Date.now);
  const [canBiometric, setCanBiometric] = useState(false);
  const blocked = until > now;

  const biometric = useCallback(async () => {
    setBusy(true);
    const ok = await authenticateBiometric({ title: t('security.unlockTitle'), cancel: t('security.usePin') });
    setBusy(false);
    if (ok) unlock();
  }, [setBusy, t, unlock]);

  // Empreinte proposée d'emblée si elle est activée.
  useEffect(() => {
    if (!isBiometricEnabled()) return;
    void biometricAvailable().then((available) => {
      setCanBiometric(available);
      if (available && lockedUntil() <= Date.now()) void biometric();
    });
  }, [biometric]);

  // Le bouton retour d'Android ne contourne pas le verrou.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Compte à rebours pendant un blocage.
  useEffect(() => {
    if (!blocked) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [blocked]);

  const submit = async (code: string) => {
    const result = await tryUnlock(code);
    if (result === 'ok') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      unlock();
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setErrorKey((k) => k + 1);
    setPin('');
    const next = lockedUntil();
    setUntil(next);
    setNow(Date.now());
    setMessage(next > Date.now() ? null : t('security.wrong', { count: attemptsLeft(failures()) }));
  };

  const onDigit = (d: string) => {
    if (blocked || pin.length >= length) return;
    const next = pin + d;
    setPin(next);
    setMessage(null);
    if (next.length === length) void submit(next);
  };

  const seconds = Math.ceil((until - now) / 1000);
  const status = blocked ? t('security.blocked', { seconds }) : (message ?? t('security.enterPin'));

  return (
    <View
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.screen, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}
    >
      <TricolorBand />
      <View style={styles.top}>
        <IconTile icon={LockKeyIcon} size="lg" />
        <Text variant="title" accessibilityRole="header">
          {t('security.locked')}
        </Text>
        <Text
          tone={message || blocked ? 'danger' : 'muted'}
          accessibilityLiveRegion="polite"
          style={styles.center}
        >
          {status}
        </Text>
        <PinDots
          slots={length}
          filled={pin.length}
          errorKey={errorKey}
          error={!!message}
          accessibilityLabel={t('security.dotsLabel', { filled: pin.length, total: length })}
        />
      </View>

      <PinPad
        onDigit={onDigit}
        onDelete={() => setPin((p) => p.slice(0, -1))}
        deleteLabel={t('common.clear')}
        disabled={blocked}
        extra={canBiometric ? { icon: FingerprintIcon, label: t('security.useBiometric'), onPress: () => void biometric() } : undefined}
      />

      <View style={styles.bottom}>
        <Button
          variant="ghost"
          label={t('security.forgot')}
          onPress={() => Alert.alert(t('security.forgot'), t('security.forgotMessage'))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between', zIndex: 1000, elevation: 1000 },
  top: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  center: { textAlign: 'center', minHeight: 24 },
  bottom: { paddingHorizontal: spacing.lg },
});
