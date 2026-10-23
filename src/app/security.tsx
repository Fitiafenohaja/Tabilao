import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { PinEntry } from '@/features/security/PinEntry';
import { useLock } from '@/features/security/lockStore';
import {
  attemptsLeft,
  authenticateBiometric,
  biometricAvailable,
  disableLock,
  failures,
  isBiometricEnabled,
  isLockEnabled,
  isWeakPin,
  LOCK_DELAYS,
  lockDelay,
  lockedUntil,
  pinLength,
  setBiometricEnabled,
  setLockDelay,
  setPin,
  tryUnlock,
  type LockDelay,
} from '@/services/security';
import {
  Button,
  Card,
  Chip,
  FingerprintIcon,
  IconTile,
  KeyIcon,
  ListRow,
  LockKeyIcon,
  Screen,
  Section,
  ShieldCheckIcon,
  Text,
  TimerIcon,
  spacing,
  useTheme,
  useToast,
} from '@/ui';

type Flow =
  | { step: 'overview' }
  | { step: 'verify'; then: 'change' | 'disable' }
  | { step: 'new' }
  | { step: 'confirm'; pin: string }
  | { step: 'biometric' };

// Verrouillage par code (4–6 chiffres) et empreinte. Désactivé par défaut, activable en 2 gestes.
export default function SecurityScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const setBusy = useLock((s) => s.setBusy);
  const [enabled, setEnabled] = useState(isLockEnabled);
  const [flow, setFlow] = useState<Flow>({ step: 'overview' });
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(isBiometricEnabled);
  const [delay, setDelay] = useState<LockDelay>(lockDelay);

  useEffect(() => {
    void biometricAvailable().then(setBioAvailable);
  }, []);

  const go = (next: Flow) => {
    setError(null);
    setFlow(next);
  };
  const fail = (message: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setError(message);
    setErrorKey((k) => k + 1);
  };

  const finishSetup = async (pin: string) => {
    await setPin(pin);
    setEnabled(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.show(t('security.enabled'));
    go(bioAvailable && !isBiometricEnabled() ? { step: 'biometric' } : { step: 'overview' });
  };

  const toggleBiometric = async (on: boolean) => {
    if (on) {
      // On vérifie l'empreinte avant de l'activer.
      setBusy(true);
      const ok = await authenticateBiometric({ title: t('security.biometricTitle'), cancel: t('common.cancel') });
      setBusy(false);
      if (!ok) return;
    }
    setBiometricEnabled(on);
    setBioOn(on);
  };

  const delayLabel = (d: LockDelay) => (d < 60_000 ? t('security.seconds', { count: d / 1000 }) : t('security.minutes', { count: d / 60_000 }));

  let body: React.ReactNode;
  switch (flow.step) {
    case 'verify':
      body = (
        <PinEntry
          key={`${flow.step}-${errorKey}`}
          title={t('security.currentPin')}
          length={pinLength() ?? 4}
          error={error}
          errorKey={errorKey}
          onComplete={async (pin) => {
            const result = await tryUnlock(pin);
            if (result === 'blocked') return fail(t('security.blocked', { seconds: Math.ceil((lockedUntil() - Date.now()) / 1000) }));
            if (result === 'wrong') return fail(t('security.wrong', { count: attemptsLeft(failures()) }));
            if (flow.then === 'change') return go({ step: 'new' });
            disableLock();
            setEnabled(false);
            setBioOn(false);
            toast.show(t('security.disabled'));
            go({ step: 'overview' });
          }}
        />
      );
      break;
    case 'new':
      body = (
        <PinEntry
          key={`${flow.step}-${errorKey}`}
          title={t('security.choosePin')}
          hint={t('security.choosePinHint')}
          error={error}
          errorKey={errorKey}
          onComplete={(pin) => (isWeakPin(pin) ? fail(t('security.weak')) : go({ step: 'confirm', pin }))}
        />
      );
      break;
    case 'confirm':
      body = (
        <PinEntry
          key={`${flow.step}-${errorKey}`}
          title={t('security.confirmPin')}
          hint={t('security.confirmPinHint')}
          length={flow.pin.length}
          error={error}
          errorKey={errorKey}
          onComplete={(pin) => {
            if (pin === flow.pin) return void finishSetup(pin);
            setFlow({ step: 'new' });
            fail(t('security.mismatch'));
          }}
        />
      );
      break;
    case 'biometric':
      body = (
        <View style={styles.center}>
          <IconTile icon={FingerprintIcon} size="lg" />
          <Text variant="title" style={styles.text}>
            {t('security.biometricTitle')}
          </Text>
          <Text tone="muted" style={styles.text}>
            {t('security.biometricHint')}
          </Text>
          <View style={styles.actions}>
            <Button
              icon={FingerprintIcon}
              label={t('security.biometricEnable')}
              onPress={async () => {
                await toggleBiometric(true);
                go({ step: 'overview' });
              }}
            />
            <Button variant="ghost" label={t('security.later')} onPress={() => go({ step: 'overview' })} />
          </View>
        </View>
      );
      break;
    default:
      body = enabled ? (
        <>
          <Card style={styles.status}>
            <IconTile icon={ShieldCheckIcon} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading">{t('security.on')}</Text>
              <Text variant="caption" tone="muted">
                {t('security.onHint', { count: pinLength() ?? 4 })}
              </Text>
            </View>
          </Card>

          {bioAvailable ? (
            <Section flush>
              <ListRow
                icon={FingerprintIcon}
                iconBg="primarySoft"
                iconFg="onPrimarySoft"
                title={t('security.useBiometric')}
                subtitle={t('security.biometricRowHint')}
                trailing={
                  <Switch
                    accessibilityLabel={t('security.useBiometric')}
                    value={bioOn}
                    onValueChange={(on) => void toggleBiometric(on)}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={colors.card}
                  />
                }
              />
            </Section>
          ) : null}

          <Section title={t('security.delayTitle')}>
            <View style={styles.chips}>
              {LOCK_DELAYS.map((d) => (
                <Chip
                  key={d}
                  icon={delay === d ? TimerIcon : undefined}
                  label={delayLabel(d)}
                  selected={delay === d}
                  onPress={() => {
                    setLockDelay(d);
                    setDelay(d);
                  }}
                />
              ))}
            </View>
            <Text variant="caption" tone="muted">
              {t('security.delayHint')}
            </Text>
          </Section>

          <Section flush>
            <ListRow icon={KeyIcon} title={t('security.changePin')} onPress={() => go({ step: 'verify', then: 'change' })} />
          </Section>

          <Button
            variant="danger"
            label={t('security.disable')}
            onPress={() =>
              Alert.alert(t('security.disable'), t('security.disableConfirm'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('security.disable'), style: 'destructive', onPress: () => go({ step: 'verify', then: 'disable' }) },
              ])
            }
          />
        </>
      ) : (
        <>
          <View style={styles.center}>
            <IconTile icon={LockKeyIcon} size="lg" />
            <Text variant="title" style={styles.text}>
              {t('security.introTitle')}
            </Text>
            <Text tone="muted" style={styles.text}>
              {t('security.introText')}
            </Text>
          </View>
          <Section flush>
            <ListRow icon={KeyIcon} title={t('security.benefitPin')} />
            <ListRow icon={FingerprintIcon} title={t('security.benefitBiometric')} />
            <ListRow icon={TimerIcon} title={t('security.benefitAuto')} />
          </Section>
          <Text variant="caption" tone="warning" style={styles.text}>
            {t('security.forgotMessage')}
          </Text>
          <Button icon={LockKeyIcon} label={t('security.enable')} onPress={() => go({ step: 'new' })} />
        </>
      );
  }

  const inFlow = flow.step !== 'overview';
  return (
    <Screen scroll={!inFlow}>
      <Stack.Screen options={{ title: t('security.title') }} />
      {inFlow && flow.step !== 'biometric' ? (
        <>
          {body}
          <Button variant="ghost" label={t('common.cancel')} onPress={() => go({ step: 'overview' })} />
        </>
      ) : (
        body
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  center: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  text: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
