import { router } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { useTranslation } from 'react-i18next';

import { DatabaseIcon, GearSixIcon, HouseIcon, SquaresFourIcon, TabBar, type TabIcons } from '@/ui';

const ICONS: TabIcons = { index: HouseIcon, tables: SquaresFourIcon, data: DatabaseIcon, settings: GearSixIcon };

// Menu principal : Accueil · Tableaux · [+ Saisie] · Données · Réglages.
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar {...props} icons={ICONS} centerAction={{ label: t('nav.entry'), onPress: () => router.push('/quick-entry') }} />
      )}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.home') }} />
      <Tabs.Screen name="tables" options={{ title: t('nav.tables') }} />
      <Tabs.Screen name="data" options={{ title: t('nav.data') }} />
      <Tabs.Screen name="settings" options={{ title: t('nav.settings') }} />
    </Tabs>
  );
}
