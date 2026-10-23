import { headerNames, issuesToCsv, planImport, type MappedRow } from '@/services/import';

const row = (line: number, data: MappedRow['data'], invalid: MappedRow['invalid'] = []): MappedRow => ({ line, data, invalid });

const base = { duplicates: new Set<number>(), skipDuplicates: true, invalidPolicy: 'empty' as const, fieldNames: { p: 'Produit', q: 'Quantité' }, requiredFieldIds: [] };

describe('plan d’import (étapes 7 à 10)', () => {
  const rows = [
    row(2, { p: 'Savon', q: 3 }),
    row(3, { p: 'Savon', q: 3 }),
    row(4, { p: 'Riz' }, [{ fieldId: 'q', raw: 'beaucoup' }]),
    row(5, { p: null, q: null }),
  ];

  it('ignore lignes vides et doublons, corrige les valeurs invalides', () => {
    const { rows: out, report } = planImport(rows, { ...base, duplicates: new Set([1]) });
    expect(out).toEqual([{ p: 'Savon', q: 3 }, { p: 'Riz' }]);
    expect(report).toMatchObject({ total: 4, imported: 2, skipped: 2, corrected: 1 });
    expect(report.issues.map((i) => i.reason)).toEqual(['Doublon ignoré', 'Valeur invalide']);
    expect(report.issues[1]).toMatchObject({ line: 4, field: 'Quantité', value: 'beaucoup' });
  });

  it('peut garder les doublons et ignorer les lignes invalides', () => {
    const { report } = planImport(rows, { ...base, duplicates: new Set([1]), skipDuplicates: false, invalidPolicy: 'skip' });
    expect(report).toMatchObject({ imported: 2, skipped: 2, corrected: 0 });
  });

  it('ignore les lignes dont un champ obligatoire est vide', () => {
    const { report } = planImport(rows, { ...base, requiredFieldIds: ['q'] });
    expect(report.imported).toBe(2);
    expect(report.issues.some((i) => i.reason === 'Champ obligatoire vide' && i.line === 4)).toBe(true);
  });

  it('exporte le rapport d’erreurs en CSV', () => {
    const csv = issuesToCsv([{ line: 4, field: 'Quantité', value: 'beaucoup', reason: 'Valeur invalide' }]);
    expect(csv).toBe('﻿Ligne;Champ;Valeur;Problème\r\n4;Quantité;beaucoup;Valeur invalide');
  });

  it('nettoie les en-têtes pour en faire des noms de champs', () => {
    const sheet = { name: 's', rows: [['Prix', null, 'prix', '{Total}'], [1, 2, 3, 4, 5]] };
    expect(headerNames(sheet, 0)).toEqual(['Prix', 'Colonne 2', 'prix (2)', 'Total', 'Colonne 5']);
  });
});
