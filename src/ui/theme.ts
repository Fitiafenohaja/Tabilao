// Tokens du design system Tabilao — voir docs/tabilao-architecture-design.md §9–13.
import { formatAmount } from '@/services/money';

export const palette = {
  green50: '#EEF8F2',
  green100: '#D9F0E3',
  green500: '#2E9A5C',
  green600: '#007E3A', // Vert Tabilao (drapeau)
  green700: '#00652F',
  red100: '#FDE2E0',
  red500: '#FC3D32', // Rouge drapeau (décor, pastilles)
  red600: '#D62B21', // Rouge lisible (textes, boutons)
  amber600: '#B7791F',
  amber800: '#8A5A12', // Ambre lisible sur fond clair (5,5:1)
  white: '#FFFFFF',
  ink900: '#14201A',
  ink600: '#4A5A52',
  ink400: '#8A9890',
  line: '#E3E9E5',
  surface: '#F6F8F7',
} as const;

export type ThemeColors = Record<
  | 'background' | 'card' | 'text' | 'textMuted' | 'placeholder' | 'border'
  | 'primary' | 'primaryPressed' | 'primarySoft' | 'primaryTint' | 'onPrimary'
  | 'danger' | 'dangerSoft' | 'accent' | 'warning' | 'warningSoft' | 'neutralSoft' | 'onPrimarySoft' | 'onDangerSoft' | 'income' | 'expense' | 'scrim',
  string
>;

export const lightTheme: ThemeColors = {
  background: palette.surface,
  card: palette.white,
  text: palette.ink900,
  textMuted: palette.ink600,
  placeholder: palette.ink400,
  border: palette.line,
  primary: palette.green600,
  primaryPressed: palette.green700,
  primarySoft: palette.green100,
  primaryTint: palette.green50,
  onPrimary: palette.white,
  danger: palette.red600,
  dangerSoft: palette.red100,
  accent: palette.red500,
  warning: palette.amber800,
  warningSoft: '#FBF1E1',
  onPrimarySoft: palette.green700,
  onDangerSoft: '#A8221A',
  neutralSoft: '#EEF2F0',
  income: palette.green600,
  expense: palette.red600,
  scrim: 'rgba(20, 32, 26, 0.45)',
};

export const darkTheme: ThemeColors = {
  background: '#0F1613',
  card: '#18221D',
  text: '#ECF2EE',
  textMuted: '#A9B8B0',
  placeholder: '#6F7E76',
  border: '#2A3630',
  primary: '#3DBE74',
  primaryPressed: '#2E9A5C',
  primarySoft: '#173A27',
  primaryTint: '#13241B',
  onPrimary: '#0F1613',
  danger: '#FF6B61',
  dangerSoft: '#3A1A18',
  accent: '#FF6B61',
  warning: '#E0A84A',
  warningSoft: '#3A2D14',
  onPrimarySoft: '#6FD99A',
  onDangerSoft: '#FF8A82',
  neutralSoft: '#222D27',
  income: '#3DBE74',
  expense: '#FF6B61',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { field: 12, card: 16, fab: 28, pill: 999 } as const;
/** Cible tactile minimale (dp). */
export const touchTarget = 48;
export const iconSize = { sm: 18, md: 22, lg: 28, xl: 40 } as const;
/** Hauteur de la barre de navigation basse (hors safe area). */
export const tabBarHeight = 64;

/** Élévations : une seule échelle pour cartes, barre de navigation, bouton central. */
export const elevation = {
  card: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  bar: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 8 },
  fab: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
} as const;

export const typography = {
  display: { fontFamily: 'Inter-Bold', fontSize: 28, lineHeight: 34 },
  title: { fontFamily: 'Inter-SemiBold', fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: 'Inter-SemiBold', fontSize: 18, lineHeight: 24 },
  body: { fontFamily: 'Inter-Regular', fontSize: 16, lineHeight: 24 },
  label: { fontFamily: 'Inter-Medium', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 16 },
  amount: { fontFamily: 'Inter-SemiBold', fontSize: 18, lineHeight: 24, fontVariant: ['tabular-nums'] as const },
} as const;

export type TypographyVariant = keyof typeof typography;

export const formatAriary = (value: number): string => formatAmount(value);
