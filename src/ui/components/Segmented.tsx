import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { radius, spacing } from '../theme';
import { Text } from './Text';

type Props<T extends string> = { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string };

/** Choix exclusif compact (Aujourd'hui · Semaine · Mois), 48 dp, sélection marquée par le fond et le gras. */
export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.track, { backgroundColor: colors.neutralSoft }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.option, selected && [styles.selected, { backgroundColor: colors.card }]]}
          >
            <Text
              variant="label"
              numberOfLines={1}
              style={{ color: selected ? colors.text : colors.textMuted, fontFamily: selected ? 'Inter-SemiBold' : 'Inter-Medium' }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.field, padding: 4, gap: 4 },
  option: { flex: 1, minHeight: 40, borderRadius: radius.field - 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  selected: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
});
