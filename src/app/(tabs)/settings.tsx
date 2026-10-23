import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { metaRepo } from '@/data/repositories';
import { useDbQuery } from '@/features/useDbQuery';
import { LANGUAGES, type Language } from '@/i18n';
import { isLockEnabled } from '@/services/security';
import {
  Badge,
  Chip,
  CurrencyIcon,
  FloppyDiskIcon,
  InfoIcon,
  ListRow,
  LockIcon,
  Logo,
  Screen,
  ScreenHeader,
  Section,
  SquaresFourIcon,
  Text,
  TranslateIcon,
  spacing,
  useTheme,
} from '@/ui';

const LANGUAGE_NAMES: Record<Language, string> = { fr: 'Français', mg: 'Malagasy', en: 'English' };

// Réglages : langue, devise, sécurité, sauvegarde, à propos.
export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lockOn = useDbQuery(isLockEnabled, []);
  const setLanguage = (lng: Language) => {
    metaRepo.set('locale', lng);
    void i18n.changeLanguage(lng);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('settings.title')} />
      <Screen inTabs>
        <Section title={t('settings.sectionGeneral')} flush>
          <View>
            <ListRow icon={TranslateIcon} title={t('settings.language')} subtitle={LANGUAGE_NAMES[i18n.language as Language]} />
            <View style={styles.languages}>
              {LANGUAGES.map((lng) => (
                <Chip key={lng} label={LANGUAGE_NAMES[lng]} selected={i18n.language === lng} onPress={() => setLanguage(lng)} />
              ))}
            </View>
          </View>
          <ListRow icon={CurrencyIcon} title={t('settings.currency')} subtitle={t('settings.currencyValue')} />
          <ListRow
            icon={SquaresFourIcon}
            title={t('settings.archived')}
            subtitle={t('settings.archivedHint')}
            onPress={() => router.navigate('/tables')}
          />
        </Section>

        <Section title={t('settings.sectionSecurity')} flush>
          <ListRow
            icon={LockIcon}
            iconBg={lockOn ? 'primarySoft' : undefined}
            iconFg={lockOn ? 'onPrimarySoft' : undefined}
            title={t('settings.pin')}
            subtitle={t('settings.pinHint')}
            trailing={<Badge tone={lockOn ? 'success' : 'neutral'} label={lockOn ? t('security.badgeOn') : t('security.badgeOff')} />}
            onPress={() => router.push('/security')}
          />
          <ListRow icon={FloppyDiskIcon} title={t('backup.title')} onPress={() => router.push('/backup')} />
        </Section>

        <Section title={t('settings.sectionAbout')} flush>
          <ListRow icon={InfoIcon} title={t('settings.version', { version: Constants.expoConfig?.version ?? '—' })} subtitle={t('settings.offline')} />
        </Section>

        <View style={styles.about}>
          <Logo size={40} />
          <Text variant="caption" tone="muted">
            {t('app.slogan')}
          </Text>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  languages: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  about: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
});
