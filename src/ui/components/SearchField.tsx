import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MagnifyingGlassIcon, XIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing, typography } from '../theme';

type Props = { value: string; onChangeText: (text: string) => void; placeholder: string; clearLabel: string };

/** Champ de recherche avec loupe et bouton d'effacement. */
export function SearchField({ value, onChangeText, placeholder, clearLabel }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <MagnifyingGlassIcon size={iconSize.md} color={colors.textMuted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
        style={[typography.body, styles.input, { color: colors.text }]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel={clearLabel} hitSlop={12} onPress={() => onChangeText('')}>
          <XIcon size={iconSize.sm} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.lg },
  input: { flex: 1, paddingVertical: spacing.sm },
});
