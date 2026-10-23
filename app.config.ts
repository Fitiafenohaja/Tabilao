import type { ExpoConfig } from 'expo/config';

// APP_VARIANT=production retire la permission INTERNET (100 % hors ligne).
// En développement, elle reste nécessaire pour joindre le serveur Metro.
const isProduction = process.env.APP_VARIANT === 'production';

const config: ExpoConfig = {
  name: 'Tabilao',
  slug: 'tabilao',
  scheme: 'tabilao',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  platforms: ['android'],
  android: {
    package: 'mg.tabilao.app',
    adaptiveIcon: {
      backgroundColor: '#EEF8F2',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['USE_BIOMETRIC', 'VIBRATE'],
    blockedPermissions: isProduction ? ['android.permission.INTERNET'] : [],
    predictiveBackGestureEnabled: false,
  },
  // Aucune mise à jour à distance : tout est embarqué dans l'APK.
  updates: { enabled: false },
  plugins: [
    'expo-router',
    ['expo-sqlite', { enableFTS: true }],
    'expo-font',
    'expo-localization',
    'expo-sharing',
    // Justificatifs photo : appareil photo seulement, pas de micro (aucune vidéo).
    ['expo-image-picker', { cameraPermission: 'Tabilao utilise l’appareil photo pour joindre un justificatif.', microphonePermission: false }],
    '@react-native-community/datetimepicker',
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', backgroundColor: '#FFFFFF', imageWidth: 160 },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
