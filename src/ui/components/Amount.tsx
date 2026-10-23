import { formatAmount, formatSignedAmount } from '@/services/money';

import { Text } from './Text';
import { useTheme } from '../ThemeProvider';
import type { TypographyVariant } from '../theme';

type Props = { value: number; kind?: 'income' | 'expense' | 'neutral'; variant?: TypographyVariant };

/** Montant : entrées en vert avec « + », sorties en rouge avec « − ». */
export function Amount({ value, kind = 'neutral', variant = 'amount' }: Props) {
  const { colors } = useTheme();
  if (kind === 'neutral') return <Text variant={variant}>{formatAmount(value)}</Text>;
  const signed = kind === 'expense' ? -Math.abs(value) : Math.abs(value);
  return (
    <Text variant={variant} style={{ color: kind === 'income' ? colors.income : colors.expense }}>
      {formatSignedAmount(signed)}
    </Text>
  );
}
