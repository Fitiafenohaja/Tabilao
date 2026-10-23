import { StyleSheet, View } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { radius, spacing } from '../theme';
import { Text } from './Text';

type Props = { label: string; tone?: 'danger' | 'success' | 'warning' | 'neutral' };

/** Pastille de statut (texte toujours présent : la couleur n'est jamais le seul indice). */
export function Badge({ label, tone = 'danger' }: Props) {
  const { colors } = useTheme();
  const { bg, fg } = {
    danger: { bg: colors.dangerSoft, fg: colors.onDangerSoft },
    success: { bg: colors.primarySoft, fg: colors.onPrimarySoft },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    neutral: { bg: colors.neutralSoft, fg: colors.textMuted },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" style={{ color: fg, fontFamily: 'Inter-SemiBold' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
});
