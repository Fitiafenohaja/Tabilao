import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../ThemeProvider';
import { spacing } from '../theme';
import { Text } from './Text';
import { TricolorBand } from './TricolorBand';

type Props = { title: string; subtitle?: string; leading?: ReactNode; actions?: ReactNode; band?: boolean };

/** En-tête des écrans principaux (onglets) : grand titre, sous-titre, actions à droite. */
export function ScreenHeader({ title, subtitle, leading, actions, band = false }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      {band ? <TricolorBand /> : null}
      <View style={styles.row}>
        {leading}
        <View style={styles.titles}>
          <Text variant="title" accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  titles: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
