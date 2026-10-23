import i18n from './index';

// Le malgache n'est pas toujours présent dans l'ICU d'Android : repli sur le français.
const locale = () => (i18n.language === 'en' ? 'en-GB' : 'fr-FR');

/** Date ISO (AAAA-MM-JJ ou horodatage) → « 23 oct. 2026 ». */
export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return date.toLocaleDateString(locale(), options);
  } catch {
    return iso.slice(0, 10);
  }
}

export const formatToday = () => formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' });
