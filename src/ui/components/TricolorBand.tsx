import { StyleSheet, View } from 'react-native';

import { palette } from '../theme';

/** Bande signature blanc · rouge · vert (4 px), clin d'œil discret au drapeau. */
export function TricolorBand() {
  return (
    <View style={styles.band} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.part, { backgroundColor: palette.white, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.line }]} />
      <View style={[styles.part, { backgroundColor: palette.red500 }]} />
      <View style={[styles.part, { backgroundColor: palette.green600 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { flexDirection: 'row', height: 4 },
  part: { flex: 1 },
});
