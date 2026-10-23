import { StyleSheet, View } from 'react-native';

import { formatAmount } from '@/services/money';

import { ArrowDownIcon, ArrowUpIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, spacing } from '../theme';
import { Text } from './Text';

type Props = { label: string; value: number; kind: 'income' | 'expense' | 'balance' };

/** Ligne de synthèse du jour : flèche + signe + couleur (jamais la couleur seule). */
export function StatTile({ label, value, kind }: Props) {
  const { colors } = useTheme();
  const color = kind === 'income' ? colors.income : kind === 'expense' ? colors.expense : colors.text;
  const sign = kind === 'income' ? '+ ' : kind === 'expense' ? '− ' : value < 0 ? '− ' : '';
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label} : ${sign}${formatAmount(Math.abs(value))}`}>
      <View style={styles.label}>
        {kind === 'income' ? <ArrowDownIcon size={iconSize.sm} color={color} weight="bold" /> : null}
        {kind === 'expense' ? <ArrowUpIcon size={iconSize.sm} color={color} weight="bold" /> : null}
        <Text variant={kind === 'balance' ? 'heading' : 'body'} tone={kind === 'balance' ? 'default' : 'muted'}>
          {label}
        </Text>
      </View>
      <Text variant={kind === 'balance' ? 'display' : 'amount'} style={{ color, fontSize: kind === 'balance' ? 24 : 18 }}>
        {sign}
        {formatAmount(Math.abs(value))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 32 },
  label: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
