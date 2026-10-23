import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CaretRightIcon, type Icon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, spacing, touchTarget, type ThemeColors } from '../theme';
import { IconTile } from './IconTile';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  icon?: Icon;
  iconBg?: keyof ThemeColors;
  iconFg?: keyof ThemeColors;
  trailing?: ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
};

/** Ligne de menu : icône teintée, titre, sous-titre, chevron. Utilisée dans les sections de réglages et de données. */
export function ListRow({ title, subtitle, icon, iconBg, iconFg, trailing, onPress, tone = 'default', disabled = false }: Props) {
  const { colors } = useTheme();
  const danger = tone === 'danger';
  const content = (
    <>
      {icon ? (
        <IconTile icon={icon} bg={iconBg ?? (danger ? 'dangerSoft' : 'neutralSoft')} fg={iconFg ?? (danger ? 'onDangerSoft' : 'textMuted')} />
      ) : null}
      <View style={styles.text}>
        <Text variant="body" style={{ fontFamily: 'Inter-Medium', color: danger ? colors.danger : colors.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <CaretRightIcon size={iconSize.sm} color={colors.placeholder} /> : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.neutralSoft }, disabled && { opacity: 0.45 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget + 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1, gap: 2 },
});
