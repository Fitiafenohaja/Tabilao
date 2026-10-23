import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { metaRepo } from '@/data/repositories';
import {
  Banner,
  FileArrowDownIcon,
  ListRow,
  Logo,
  Screen,
  Section,
  SquaresFourIcon,
  TableIcon,
  Text,
  TricolorBand,
  spacing,
} from '@/ui';

// Premier démarrage : trois choix, aucun compte, promesse hors ligne.
export default function Onboarding() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const go = (href: '/tables/new' | '/tables/create' | '/import') => {
    metaRepo.set('onboarding_done', '1');
    router.replace('/');
    router.push(href);
  };
  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <TricolorBand />
      <Screen>
        <View style={styles.hero}>
          <Logo size={72} />
          <Text variant="display" style={styles.center}>
            {t('onboarding.title')}
          </Text>
          <Text tone="muted" style={styles.center}>
            {t('app.slogan')}
          </Text>
        </View>

        <Section flush>
          <ListRow
            icon={SquaresFourIcon}
            iconBg="primarySoft"
            iconFg="onPrimarySoft"
            title={t('onboarding.useTemplate')}
            subtitle={t('onboarding.templateHint')}
            onPress={() => go('/tables/new')}
          />
          <ListRow icon={TableIcon} title={t('onboarding.createTable')} subtitle={t('onboarding.blankHint')} onPress={() => go('/tables/create')} />
          <ListRow icon={FileArrowDownIcon} title={t('onboarding.importFile')} subtitle={t('onboarding.importHint')} onPress={() => go('/import')} />
        </Section>

        <Banner tone="info" title={t('onboarding.privacyTitle')} message={t('onboarding.offline')} />
        <Text variant="caption" tone="warning" style={styles.center}>
          {t('onboarding.backupHint')}
        </Text>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.md },
  center: { textAlign: 'center' },
});
