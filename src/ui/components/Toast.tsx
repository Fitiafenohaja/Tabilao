import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { CheckCircleIcon, WarningIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { elevation, iconSize, radius, spacing, tabBarHeight } from '../theme';
import { Text } from './Text';

type ToastState = {
  message: string | null;
  tone: 'success' | 'error';
  show: (message: string, tone?: 'success' | 'error') => void;
  hide: () => void;
};

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'success',
  show: (message, tone = 'success') => set({ message, tone }),
  hide: () => set({ message: null }),
}));

/** Confirmation 3 s en bas d'écran, au-dessus de la barre de navigation. Annoncée sans prendre le focus. */
export function ToastHost() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { message, tone, hide } = useToast();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 3000);
    return () => clearTimeout(timer);
  }, [message, hide]);

  if (!message) return null;
  const success = tone === 'success';
  const Icon = success ? CheckCircleIcon : WarningIcon;
  return (
    <View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        styles.toast,
        { bottom: insets.bottom + tabBarHeight + spacing.lg, backgroundColor: success ? colors.primary : colors.danger },
      ]}
    >
      <Icon size={iconSize.md} color={colors.onPrimary} weight="fill" />
      <Text variant="label" style={{ color: colors.onPrimary, flex: 1 }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.field,
    ...elevation.fab,
  },
});
