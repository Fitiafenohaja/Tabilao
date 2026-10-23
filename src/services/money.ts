// Montants stockés en entiers (ariary, ou centimes pour une devise à décimales).
// Jamais de REAL pour l'argent.

export type Currency = { code: string; symbol: string; decimals: number };

export const ARIARY: Currency = { code: 'MGA', symbol: 'Ar', decimals: 0 };

/** Convertit une saisie utilisateur (« 12 500 », « 12,5 ») en unités entières. */
export function parseAmount(input: string, currency: Currency = ARIARY): number | null {
  const cleaned = input.replace(/[\s  ]/g, '').replace(currency.symbol, '').replace(',', '.');
  if (cleaned === '' || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 10 ** currency.decimals);
}

/** Formate des unités entières : 12500 → « 12 500 Ar ». */
export function formatAmount(units: number, currency: Currency = ARIARY): string {
  const value = units / 10 ** currency.decimals;
  const text = value
    .toLocaleString('fr-FR', {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    })
    .replace(/[  ]/g, ' ');
  return `${text} ${currency.symbol}`;
}

/** Montant signé pour l'affichage : « + 245 000 Ar » / « − 38 500 Ar ». */
export function formatSignedAmount(units: number, currency: Currency = ARIARY): string {
  const sign = units < 0 ? '−' : '+';
  return `${sign} ${formatAmount(Math.abs(units), currency)}`;
}
