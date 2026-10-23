import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { formatDate } from '@/i18n/format';

import { metaRepo } from '@/data/repositories';
import { createBackup, listBackups, restoreBackup, type BackupCheck } from '@/services/backup';
import {
  Banner,
  Button,
  ClockCounterClockwiseIcon,
  EmptyState,
  FileArrowDownIcon,
  FloppyDiskIcon,
  IconButton,
  ListRow,
  Screen,
  Section,
  ShieldCheckIcon,
  useToast,
} from '@/ui';

const FAILURE_KEYS: Record<Exclude<BackupCheck, { ok: true }>['reason'], string> = {
  corrupted: 'backup.corrupted',
  not_tabilao: 'backup.invalid',
  newer: 'backup.newer',
};

// Nom : tabilao-<type>-AAAA-MM-JJTHH-MM-SS.tabilao
const backupKind = (name: string) => (name.includes('-auto-') ? 'auto' : name.includes('-pre-restore-') ? 'preRestore' : 'manual');
const backupDate = (name: string) => {
  const m = /(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})/.exec(name);
  return m ? `${formatDate(m[1]!)} · ${m[2]}:${m[3]}` : name;
};

// Sauvegarde manuelle (.tabilao), partage local, restauration (fichier local ou externe).
export default function Backup() {
  const { t } = useTranslation();
  const toast = useToast();
  const [backups, setBackups] = useState(listBackups);
  const [busy, setBusy] = useState(false);

  const backupAndShare = async () => {
    try {
      const file = await createBackup('manual');
      setBackups(listBackups());
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { dialogTitle: t('backup.share') });
        metaRepo.set('last_external_backup_at', new Date().toISOString());
      }
    } catch {
      toast.show(t('errors.generic'), 'error');
    }
  };

  const restore = async (file: File) => {
    setBusy(true);
    try {
      const result = await restoreBackup(file);
      if (result.ok) {
        toast.show(t('backup.restored'));
        router.dismissTo('/');
      } else {
        Alert.alert(t('backup.restore'), t(FAILURE_KEYS[result.reason]));
      }
    } catch {
      toast.show(t('errors.generic'), 'error');
    } finally {
      setBusy(false);
      setBackups(listBackups());
    }
  };

  const confirmRestore = (file: File) =>
    Alert.alert(t('backup.restore'), t('backup.restoreConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('backup.restore'), style: 'destructive', onPress: () => void restore(file) },
    ]);

  const pickAndRestore = async () => {
    // Les fichiers .tabilao n'ont pas de type MIME connu d'Android : tout fichier est accepté, puis vérifié.
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    const asset = result.assets?.[0];
    if (!result.canceled && asset) confirmRestore(new File(asset.uri));
  };

  return (
    <Screen
      footer={
        <>
          <Button icon={FloppyDiskIcon} label={t('backup.now')} loading={busy} onPress={backupAndShare} />
          <Button variant="secondary" icon={FileArrowDownIcon} label={t('backup.restoreFile')} disabled={busy} onPress={pickAndRestore} />
        </>
      }
    >
      <Banner tone="info" title={t('data.privacy')} />
      {backups.length === 0 ? (
        <EmptyState icon={ShieldCheckIcon} title={t('data.never')} message={t('home.backupMessage')} />
      ) : (
        <Section title={t('backup.local')} flush>
          {backups.map((file) => (
            <ListRow
              key={file.uri}
              icon={FloppyDiskIcon}
              iconBg={file.name.includes('-auto-') ? 'neutralSoft' : 'primarySoft'}
              iconFg={file.name.includes('-auto-') ? 'textMuted' : 'onPrimarySoft'}
              title={backupDate(file.name)}
              subtitle={`${t(`backup.kind.${backupKind(file.name)}`)} · ${Math.round((file.size ?? 0) / 1024)} Ko`}
              trailing={
                <IconButton
                  icon={ClockCounterClockwiseIcon}
                  tone="primary"
                  label={`${t('backup.restore')} ${backupDate(file.name)}`}
                  disabled={busy}
                  onPress={() => confirmRestore(file)}
                />
              }
            />
          ))}
        </Section>
      )}
    </Screen>
  );
}
