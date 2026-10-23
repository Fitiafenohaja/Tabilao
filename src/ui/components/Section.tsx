import { Children, Fragment, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { elevation, radius, spacing } from '../theme';
import { Text } from './Text';

type Props = PropsWithChildren<{ title?: string; action?: ReactNode; flush?: boolean }>;

/**
 * Groupe titré. Avec `flush`, les enfants (ListRow) sont empilés dans une carte avec séparateurs ;
 * sinon ils sont simplement espacés.
 */
export function Section({ title, action, flush = false, children }: Props) {
  const { colors } = useTheme();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      {title || action ? (
        <View style={styles.header}>
          {title ? (
            <Text variant="label" tone="muted" accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {action}
        </View>
      ) : null}
      {flush ? (
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((child, i) => (
            <Fragment key={i}>
              {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
              {child}
            </Fragment>
          ))}
        </View>
      ) : (
        <View style={styles.stack}>{items}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  title: { textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 12 },
  group: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden', ...elevation.card },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg + 40 + spacing.md },
  stack: { gap: spacing.md },
});
