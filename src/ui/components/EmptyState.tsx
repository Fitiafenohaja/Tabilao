import { StyleSheet, View } from 'react-native';

import type { Icon } from '../icons';
import { spacing } from '../theme';
import { Button } from './Button';
import { IconTile } from './IconTile';
import { Text } from './Text';

type Props = { icon: Icon; title: string; message?: string; actionLabel?: string; onAction?: () => void };

/** État vide : explique et propose l'action suivante. */
export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.box}>
      <IconTile icon={icon} size="lg" />
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" style={styles.center}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  center: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.md },
});
