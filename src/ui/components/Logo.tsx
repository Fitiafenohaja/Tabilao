import { StyleSheet, View } from 'react-native';

import { palette } from '../theme';

/** Logo : un « T » formé de trois cellules — blanche, rouge, verte. */
export function Logo({ size = 40 }: { size?: number }) {
  const cell = size / 3;
  return (
    <View accessibilityLabel="Tabilao" style={{ width: size, height: size }}>
      <View style={styles.row}>
        <View style={[styles.cell, { width: cell, height: cell, backgroundColor: palette.white, borderColor: palette.line }]} />
        <View style={[styles.cell, { width: cell, height: cell, backgroundColor: palette.red500 }]} />
        <View style={[styles.cell, { width: cell, height: cell, backgroundColor: palette.white, borderColor: palette.line }]} />
      </View>
      <View style={[styles.cell, { width: cell, height: cell * 2, marginLeft: cell, backgroundColor: palette.green600 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { borderRadius: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent' },
});
