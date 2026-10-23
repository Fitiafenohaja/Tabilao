import { Pressable, StyleSheet, View } from 'react-native';

import { CaretRightIcon, InfoIcon, WarningIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing } from '../theme';
import { Text } from './Text';

type Props = { title: string; message?: string; tone?: 'warning' | 'info' | 'danger'; onPress?: () => void };

/** Bandeau d'alerte (sauvegarde ancienne, stock bas…), icône + texte, cliquable. */
export function Banner({ title, message, tone = 'warning', onPress }: Props) {
  const { colors } = useTheme();
  const { bg, fg, Icon } = {
    warning: { bg: colors.warningSoft, fg: colors.warning, Icon: WarningIcon },
    danger: { bg: colors.dangerSoft, fg: colors.onDangerSoft, Icon: WarningIcon },
    info: { bg: colors.primaryTint, fg: colors.onPrimarySoft, Icon: InfoIcon },
  }[tone];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'alert'}
      accessibilityLabel={message ? `${title}. ${message}` : title}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.banner, { backgroundColor: bg }, pressed && { opacity: 0.85 }]}
    >
      <Icon size={iconSize.md} color={fg} weight="fill" />
      <View style={styles.text}>
        <Text variant="label" style={{ color: fg, fontFamily: 'Inter-SemiBold' }}>
          {title}
        </Text>
        {message ? (
          <Text variant="caption" style={{ color: fg }}>
            {message}
          </Text>
        ) : null}
      </View>
      {onPress ? <CaretRightIcon size={iconSize.sm} color={fg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.field, padding: spacing.md, minHeight: 56 },
  text: { flex: 1, gap: 2 },
});
