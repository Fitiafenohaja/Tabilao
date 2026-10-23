import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { CheckCircleIcon, WarningIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { elevation, iconSize, radius, spacing, tabBarHeight } from '../theme';
import { Text } from './Text';

export type ToastAction = { label: string; onPress: () => void };

type ToastState = {
  message: string | null;
  tone: 'success' | 'error';
  action: ToastAction | null;
  show: (message: string, tone?: 'success' | 'error', action?: ToastAction) => void;
  hide: () => void;
};

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'success',
  action: null,
  show: (message, tone = 'success', action) => set({ message, tone, action: action ?? null }),
  hide: () => set({ message: null, action: null }),
}));

/**
 * Confirmation en bas d'écran, au-dessus de la barre de navigation, annoncée sans prendre le focus.
 * 3 s, ou 6 s quand elle propose une action (« Annuler » après une suppression).
 */
export function ToastHost() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { message, tone, action, hide } = useToast();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, action ? 6000 : 3000);
    return () => clearTimeout(timer);
  }, [message, action, hide]);

  if (!message) return null;
  const success = tone === 'success';
  const Icon = success ? CheckCircleIcon : WarningIcon;
  return (
    <View
      accessibilityLiveRegion="polite"
      pointerEvents={action ? 'box-none' : 'none'}
      style={[
        styles.toast,
        { bottom: insets.bottom + tabBarHeight + spacing.lg, backgroundColor: success ? colors.primary : colors.danger },
      ]}
    >
      <Icon size={iconSize.md} color={colors.onPrimary} weight="fill" />
      <Text variant="label" style={{ color: colors.onPrimary, flex: 1 }}>
        {message}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={12}
          onPress={() => {
            action.onPress();
            hide();
          }}
          style={({ pressed }) => [styles.action, { borderColor: colors.onPrimary }, pressed && { opacity: 0.7 }]}
        >
          <Text variant="label" style={{ color: colors.onPrimary, fontFamily: 'Inter-SemiBold' }}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
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
  action: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: spacing.md, minHeight: 36, justifyContent: 'center' },
});
