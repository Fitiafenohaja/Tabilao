import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '../components/Text';
import { PlusIcon, type Icon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { elevation, iconSize, radius, spacing, tabBarHeight } from '../theme';

export type TabIcons = Record<string, Icon>;

type Props = BottomTabBarProps & {
  icons: TabIcons;
  /** Action centrale (« + Saisie ») insérée au milieu des onglets ; ce n'est pas une destination. */
  centerAction: { label: string; onPress: () => void };
};

/**
 * Barre de navigation basse : 4 destinations + action centrale surélevée.
 * Destination active : pastille verte, icône pleine, libellé en gras (pas la couleur seule).
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, icons, centerAction }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const middle = Math.ceil(state.routes.length / 2);

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom, height: tabBarHeight + insets.bottom },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const label = options.title ?? route.name;
        const focused = state.index === index;
        const IconComponent = icons[route.name];

        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            void Haptics.selectionAsync();
            navigateToTab(route.key);
          }
        };

        return (
          <Fragment key={route.key}>
            {index === middle ? <CenterButton {...centerAction} /> : null}
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}
            >
              <View style={[styles.indicator, focused && { backgroundColor: colors.primarySoft }]}>
                {IconComponent ? (
                  <IconComponent
                    size={iconSize.md}
                    color={focused ? colors.onPrimarySoft : colors.textMuted}
                    weight={focused ? 'fill' : 'regular'}
                  />
                ) : null}
              </View>
              <Text
                variant="caption"
                numberOfLines={1}
                style={{ color: focused ? colors.onPrimarySoft : colors.textMuted, fontFamily: focused ? 'Inter-SemiBold' : 'Inter-Medium' }}
              >
                {label}
              </Text>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

function CenterButton({ label, onPress }: Props['centerAction']) {
  const { colors } = useTheme();
  return (
    <View style={styles.item}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        hitSlop={8}
        style={({ pressed }) => [
          styles.center,
          { backgroundColor: pressed ? colors.primaryPressed : colors.primary, borderColor: colors.card },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <PlusIcon size={iconSize.lg} color={colors.onPrimary} weight="bold" />
      </Pressable>
      <Text variant="caption" style={{ color: colors.primary, fontFamily: 'Inter-SemiBold' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.xs, ...elevation.bar },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: tabBarHeight },
  indicator: { width: 56, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  center: {
    width: 56,
    height: 56,
    borderRadius: radius.fab,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    ...elevation.fab,
  },
});
