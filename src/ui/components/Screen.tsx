import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../ThemeProvider';
import { spacing } from '../theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  footer?: ReactNode;
  /** Écran d'onglet : pas de marge basse système (la barre de navigation s'en charge). */
  inTabs?: boolean;
}>;

/** Conteneur d'écran : fond `surface`, marge 16, actions principales en bas (portée du pouce). */
export function Screen({ children, scroll = true, footer, inTabs = false }: Props) {
  const { colors } = useTheme();
  const body = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, inTabs && styles.tabContent]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]} edges={inTabs ? [] : ['bottom']}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? (
          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>{footer}</View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl },
  // Le bouton central de la barre déborde de 20 dp au-dessus : on laisse de la place.
  tabContent: { paddingBottom: spacing.xxxl },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
