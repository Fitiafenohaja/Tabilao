import { StyleSheet, View } from 'react-native';

import { Chip } from './Chip';

type Props = { suggestions: readonly string[]; onPick: (value: string) => void; labelPrefix: string };

/** Valeurs déjà saisies, sous le champ (retour à la ligne, pas de défilement horizontal) : un toucher remplit le champ. */
export function SuggestionChips({ suggestions, onPick, labelPrefix }: Props) {
  if (suggestions.length === 0) return null;
  return (
    <View style={styles.row}>
      {suggestions.map((s) => (
        <Chip key={s} label={s} accessibilityLabel={`${labelPrefix} ${s}`} onPress={() => onPick(s)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
