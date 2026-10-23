import type { ThemeColors } from './theme';
import { BookOpenTextIcon, PackageIcon, ShoppingCartIcon, TableIcon, WalletIcon, type Icon } from './icons';

export type CategoryVisual = { icon: Icon; bg: keyof ThemeColors; fg: keyof ThemeColors };

/** Icône et teinte de chaque catégorie de tableau (recettes en vert, dépenses en rouge, stock en ambre). */
export function categoryVisual(category: string | null | undefined): CategoryVisual {
  switch (category) {
    case 'income':
      return { icon: ShoppingCartIcon, bg: 'primarySoft', fg: 'onPrimarySoft' };
    case 'expense':
      return { icon: WalletIcon, bg: 'dangerSoft', fg: 'onDangerSoft' };
    case 'stock':
      return { icon: PackageIcon, bg: 'warningSoft', fg: 'warning' };
    case 'credit':
      return { icon: BookOpenTextIcon, bg: 'neutralSoft', fg: 'textMuted' };
    default:
      return { icon: TableIcon, bg: 'neutralSoft', fg: 'textMuted' };
  }
}
