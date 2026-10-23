import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { metaRepo } from '@/data/repositories';
import { useLock } from '@/features/security/lockStore';
import { formatDate } from '@/i18n/format';
import {
  backupNeedsPassword,
  createBackup,
  isProtectedBackup,
  listBackups,
  passwordProblem,
  restoreBackup,
  type BackupProblem,
} from '@/services/backup';
import {
  Badge,
  Banner,
  Button,
  ClockCounterClockwiseIcon,
  EmptyState,
  ExportIcon,
  FileArrowDownIcon,
  FloppyDiskIcon,
  IconButton,
  ListRow,
  LockKeyIcon,
  PasswordField,
  Screen,
  Section,
  Sheet,
  ShieldCheckIcon,
  spacing,
  useToast,
} from '@/ui';

const FAILURE_KEYS: Record<BackupProblem, string> = {
  corrupted: 'backup.corrupted',
  not_tabilao: 'backup.invalid',
  newer: 'backup.newer',
  needs_password: 'backup.protected.needed',
  wrong_password: 'backup.protected.wrong',
};

// Nom : tabilao-<type>-AAAA-MM-JJTHH-MM-SS[-enc].tabilao
const backupKind = (name: string) => (name.includes('-auto-') ? 'auto' : name.includes('-pre-restore-') ? 'preRestore' : 'manual');
const backupDate = (name: string) => {
  const m = /(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})/.exec(name);
  return m ? `${formatDate(m[1]!)} · ${m[2]}:${m[3]}` : name;
};

type SheetState = { mode: 'protect' } | { mode: 'unlock'; file: File } | null;

// Sauvegarde manuelle (.tabilao), protégée ou non par mot de passe, partage local, restauration.
export default function Backup() {
  const { t } = useTranslation();
  const toast = useToast();
  const setLockBusy = useLock((s) => s.setBusy);
  const [backups, setBackups] = useState(listBackups);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openSheet = (next: SheetState) => {
    setPassword('');
    setConfirmation('');
    setError(null);
    setSheet(next);
  };

  const share = async (file: File) => {
    if (!(await Sharing.isAvailableAsync())) return;
    // Le partage passe l'application en arrière-plan : pas de reverrouillage pendant ce temps.
    setLockBusy(true);
    try {
      await Sharing.shareAsync(file.uri, { dialogTitle: t('backup.share') });
    } finally {
      setLockBusy(false);
    }
    metaRepo.set('last_external_backup_at', new Date().toISOString());
  };

  const backupAndShare = async (withPassword?: string) => {
    setBusy(true);
    try {
      const file = await createBackup('manual', { password: withPassword });
      setBackups(listBackups());
      setSheet(null);
      await share(file);
    } catch {
      toast.show(t('errors.generic'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const protectAndShare = () => {
    const problem = passwordProblem(password, confirmation);
    if (problem) return setError(t(`backup.protected.${problem}`));
    void backupAndShare(password);
  };

  const restore = async (file: File, withPassword?: string) => {
    setBusy(true);
    try {
      const result = await restoreBackup(file, withPassword);
      if (result.ok) {
        setSheet(null);
        toast.show(t('backup.restored'));
        router.dismissTo('/');
      } else if (result.reason === 'wrong_password' || result.reason === 'needs_password') {
        // Le mot de passe se corrige dans la feuille, sans tout recommencer.
        setError(t(FAILURE_KEYS[result.reason]));
      } else {
        setSheet(null);
        Alert.alert(t('backup.restore'), t(FAILURE_KEYS[result.reason]));
      }
    } catch {
      toast.show(t('errors.generic'), 'error');
    } finally {
      setBusy(false);
      setBackups(listBackups());
    }
  };

  const startRestore = async (file: File) => {
    if (await backupNeedsPassword(file)) openSheet({ mode: 'unlock', file });
    else void restore(file);
  };

  const confirmRestore = (file: File) =>
    Alert.alert(t('backup.restore'), t('backup.restoreConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('backup.restore'), style: 'destructive', onPress: () => void startRestore(file) },
    ]);

  const pickAndRestore = async () => {
    // Les fichiers .tabilao n'ont pas de type MIME connu d'Android : tout fichier est accepté, puis vérifié.
    setLockBusy(true);
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    setLockBusy(false);
    const asset = result.assets?.[0];
    if (!result.canceled && asset) confirmRestore(new File(asset.uri));
  };

  const fieldLabels = { showLabel: t('backup.protected.show'), hideLabel: t('backup.protected.hide') };

  return (
    <Screen
      footer={
        <>
          <Button icon={ExportIcon} label={t('backup.shareNow')} disabled={busy} onPress={() => openSheet({ mode: 'protect' })} />
          <Button variant="secondary" icon={FileArrowDownIcon} label={t('backup.restoreFile')} disabled={busy} onPress={pickAndRestore} />
        </>
      }
    >
      <Banner tone="info" title={t('data.privacy')} />
      {backups.length === 0 ? (
        <EmptyState icon={ShieldCheckIcon} title={t('data.never')} message={t('home.backupMessage')} />
      ) : (
        <Section title={t('backup.local')} flush>
          {backups.map((file) => {
            const locked = isProtectedBackup(file);
            return (
              <ListRow
                key={file.uri}
                icon={locked ? LockKeyIcon : FloppyDiskIcon}
                iconBg={file.name.includes('-auto-') ? 'neutralSoft' : 'primarySoft'}
                iconFg={file.name.includes('-auto-') ? 'textMuted' : 'onPrimarySoft'}
                title={backupDate(file.name)}
                subtitle={`${t(`backup.kind.${backupKind(file.name)}`)}${locked ? ` · ${t('backup.protected.badge')}` : ''} · ${Math.round((file.size ?? 0) / 1024)} Ko`}
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
            );
          })}
        </Section>
      )}

      <Sheet
        visible={sheet?.mode === 'protect'}
        title={t('backup.protected.title')}
        closeLabel={t('common.close')}
        dismissible={!busy}
        onClose={() => setSheet(null)}
      >
        <Banner tone="info" title={t('backup.protected.why')} />
        <PasswordField
          {...fieldLabels}
          purpose="new"
          label={t('backup.protected.password')}
          help={t('backup.protected.rule')}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError(null);
          }}
        />
        <PasswordField
          {...fieldLabels}
          purpose="new"
          label={t('backup.protected.confirm')}
          value={confirmation}
          error={error ?? undefined}
          onChangeText={(v) => {
            setConfirmation(v);
            setError(null);
          }}
          onSubmitEditing={protectAndShare}
        />
        <Banner tone="warning" title={t('backup.protected.warningTitle')} message={t('backup.protected.warning')} />
        <View style={{ gap: spacing.sm }}>
          <Button
            icon={LockKeyIcon}
            label={busy ? t('backup.protected.working') : t('backup.protected.protectAndShare')}
            loading={busy}
            onPress={protectAndShare}
          />
          <Button variant="ghost" label={t('backup.protected.withoutPassword')} disabled={busy} onPress={() => void backupAndShare()} />
        </View>
        <Badge tone="neutral" label={t('backup.protected.algo')} />
      </Sheet>

      <Sheet
        visible={sheet?.mode === 'unlock'}
        title={t('backup.protected.unlockTitle')}
        closeLabel={t('common.close')}
        dismissible={!busy}
        onClose={() => setSheet(null)}
      >
        <PasswordField
          {...fieldLabels}
          label={t('backup.protected.password')}
          value={password}
          error={error ?? undefined}
          onChangeText={(v) => {
            setPassword(v);
            setError(null);
          }}
          onSubmitEditing={() => sheet?.mode === 'unlock' && void restore(sheet.file, password)}
          autoFocus
        />
        <Button
          icon={ClockCounterClockwiseIcon}
          label={busy ? t('backup.protected.working') : t('backup.restore')}
          loading={busy}
          disabled={password.length === 0}
          onPress={() => sheet?.mode === 'unlock' && void restore(sheet.file, password)}
        />
      </Sheet>
    </Screen>
  );
}
