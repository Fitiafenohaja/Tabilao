import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { typography, type TypographyVariant } from '../theme';

type Props = TextProps & { variant?: TypographyVariant; tone?: 'default' | 'muted' | 'primary' | 'danger' | 'warning' };

export function Text({ variant = 'body', tone = 'default', style, ...rest }: Props) {
  const { colors } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    danger: colors.danger,
    warning: colors.warning,
  }[tone];
  return <RNText style={[typography[variant], { color }, style]} {...rest} />;
}
