import { Image, StyleSheet, View } from 'react-native';

import { CameraIcon, ImagesIcon, TrashIcon, WarningIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { iconSize, radius, spacing } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  label: string;
  value: unknown;
  required?: boolean;
  busy?: boolean;
  error?: string;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
  labels: { camera: string; gallery: string; remove: string; preview: string };
};

/** Justificatif photo : appareil photo ou galerie, aperçu, retrait. */
export function PhotoField({ label, value, required = false, busy = false, error, onCamera, onGallery, onRemove, labels }: Props) {
  const { colors } = useTheme();
  const uri = typeof value === 'string' && value ? value : null;
  return (
    <View style={styles.wrapper}>
      <Text variant="label" tone="muted">
        {label}
        {required ? <Text variant="label" tone="danger"> *</Text> : null}
      </Text>
      {uri ? (
        <View style={[styles.preview, { borderColor: colors.border }]}>
          <Image source={{ uri }} style={styles.image} resizeMode="cover" accessibilityLabel={labels.preview} />
        </View>
      ) : null}
      <View style={styles.buttons}>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" icon={CameraIcon} label={labels.camera} loading={busy} onPress={onCamera} />
        </View>
        <View style={{ flex: 1 }}>
          <Button variant="secondary" icon={ImagesIcon} label={labels.gallery} disabled={busy} onPress={onGallery} />
        </View>
      </View>
      {uri ? <Button variant="danger" icon={TrashIcon} label={labels.remove} disabled={busy} onPress={onRemove} /> : null}
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <WarningIcon size={iconSize.sm - 4} color={colors.danger} weight="fill" />
          <Text variant="caption" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  preview: { borderRadius: radius.field, borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 4 / 3 },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  message: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
