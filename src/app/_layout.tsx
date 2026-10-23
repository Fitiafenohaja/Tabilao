import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db } from '@/data/db';
import migrations from '@/data/migrations/migrations';
import { logRepo, metaRepo, recordsRepo } from '@/data/repositories';
import { LockScreen } from '@/features/security/LockScreen';
import { useLock } from '@/features/security/lockStore';
import { useAutoLock } from '@/features/security/useAutoLock';
import { initI18n } from '@/i18n';
import { isLockEnabled } from '@/services/security';
import { runDailyAutoBackup } from '@/services/backup';
import { appFonts, Screen, Text, ThemeProvider, ToastHost, typography, useTheme } from '@/ui';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(appFonts);
  const migration = useMigrations(db, migrations);
  const ready = fontsLoaded && migration.success;

  useEffect(() => {
    if (!ready && !migration.error) return;
    void SplashScreen.hideAsync();
    if (!ready) return;
    recordsRepo.purgeTrash();
    runDailyAutoBackup().catch((e: unknown) => logRepo.add('error', 'backup', null, { message: String(e) }));
  }, [ready, migration.error]);

  if (migration.error) return <FatalError message={migration.error.message} />;
  if (!ready) return null;

  const i18n = initI18n(metaRepo.get('locale'));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <AppStack />
          </ThemeProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppStack() {
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  // Verrou appliqué avant le premier affichage : aucune donnée n'apparaît, même un instant.
  useState(() => useLock.setState({ locked: isLockEnabled() }));
  const locked = useLock((s) => s.locked);
  useAutoLock();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }} importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: typography.heading,
            headerShadowVisible: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="quick-entry" options={{ title: t('quickEntry.title'), presentation: 'modal' }} />
          <Stack.Screen name="tables/new" options={{ title: t('tables.new') }} />
          <Stack.Screen name="tables/[tableId]/entry" options={{ title: t('entry.title'), presentation: 'modal' }} />
          <Stack.Screen name="import/index" options={{ title: t('import.title') }} />
          <Stack.Screen name="backup" options={{ title: t('backup.title') }} />
          <Stack.Screen name="security" options={{ title: t('security.title') }} />
        </Stack>
        <ToastHost />
      </View>
      {locked ? <LockScreen /> : null}
    </View>
  );
}

// Affiché avant l'initialisation de l'i18n, d'où le texte en dur.
const DB_ERROR = "La base de données n'a pas pu être mise à jour. Vos données n'ont pas été modifiées.";

function FatalError({ message }: { message: string }) {
  return (
    <ThemeProvider>
      <Screen>
        <Text variant="title">Tabilao</Text>
        <Text tone="danger">{DB_ERROR}</Text>
        <Text variant="caption" tone="muted">
          {message}
        </Text>
      </Screen>
    </ThemeProvider>
  );
}
