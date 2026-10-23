import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { XIcon } from '../icons';
import { useTheme } from '../ThemeProvider';
import { radius, spacing } from '../theme';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = PropsWithChildren<{ visible: boolean; title: string; closeLabel: string; onClose: () => void; dismissible?: boolean }>;

/** Feuille modale en bas d'écran, fermable (bouton, retour Android, toucher le fond) sauf pendant un traitement. */
export function Sheet({ visible, title, closeLabel, onClose, dismissible = true, children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const close = () => {
    if (dismissible) onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={[styles.fill, { backgroundColor: colors.scrim }]} onPress={close} accessibilityLabel={closeLabel} />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.lg }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
              {title}
            </Text>
            <IconButton icon={XIcon} label={closeLabel} onPress={close} disabled={!dismissible} />
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  sheet: { borderTopLeftRadius: radius.card + 8, borderTopRightRadius: radius.card + 8, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.lg, paddingRight: spacing.sm, paddingTop: spacing.sm },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
});
