import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { initI18n } from '@/i18n';
import en from '@/i18n/en.json';
import fr from '@/i18n/fr.json';
import mg from '@/i18n/mg.json';

const i18n = initI18n('fr');

describe('compteurs de saisies', () => {
  it('jamais « 0 lignes » : un mot du métier, et « Aucune » à zéro', () => {
    expect(i18n.t('counts.income', { count: 0 })).toBe('Aucune vente');
    expect(i18n.t('counts.income', { count: 1 })).toBe('1 vente');
    expect(i18n.t('counts.income', { count: 3 })).toBe('3 ventes');
    expect(i18n.t('counts.stock', { count: 0 })).toBe('Aucun produit');
    expect(i18n.t('counts.other', { count: 12 })).toBe('12 saisies');
  });

  it('fonctionne aussi en malgache et en anglais', async () => {
    await i18n.changeLanguage('mg');
    expect(i18n.t('counts.income', { count: 0 })).toBe('Tsy mbola misy varotra');
    await i18n.changeLanguage('en');
    expect(i18n.t('counts.expense', { count: 2 })).toBe('2 expenses');
    await i18n.changeLanguage('fr');
  });
});

// Toute clé `t('…')` écrite en dur dans le code doit exister dans les trois langues.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

const has = (dict: object, key: string): boolean => {
  const parts = key.split('.');
  const leaf = parts.pop()!;
  const node = parts.reduce<Record<string, unknown> | undefined>((n, p) => n?.[p] as Record<string, unknown> | undefined, dict as Record<string, unknown>);
  return !!node && (leaf in node || `${leaf}_one` in node || `${leaf}_other` in node);
};

it('chaque clé de texte utilisée existe en fr, mg et en', () => {
  const keys = new Set<string>();
  for (const file of sourceFiles(join(__dirname, '../../src'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([a-zA-Z]+(?:\.[a-zA-Z_]+)+)'/g)) keys.add(m[1]!);
  }
  const missing = [...keys].flatMap((k) => [['fr', fr], ['mg', mg], ['en', en]].filter(([, d]) => !has(d as object, k)).map(([l]) => `${l}:${k}`));
  expect(missing).toEqual([]);
});
