import { StyleSheet, View } from 'react-native';

import type { Icon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, type ThemeColors } from '../theme';

type Props = { icon: Icon; bg?: keyof ThemeColors; fg?: keyof ThemeColors; size?: 'md' | 'lg' };

/** Pastille carrée teintée portant une icône (décorative : le texte voisin porte le sens). */
export function IconTile({ icon: IconComponent, bg = 'primarySoft', fg = 'onPrimarySoft', size = 'md' }: Props) {
  const { colors } = useTheme();
  const box = size === 'lg' ? 56 : 40;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { width: box, height: box, backgroundColor: colors[bg] }]}
    >
      <IconComponent size={size === 'lg' ? iconSize.lg : iconSize.md} color={colors[fg]} weight="duotone" />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.field, alignItems: 'center', justifyContent: 'center' },
});
