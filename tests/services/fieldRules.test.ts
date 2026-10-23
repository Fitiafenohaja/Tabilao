import { assertFieldSet, dependentsOf, FieldDefinitionError } from '@/services/fieldRules';
import { renameRef } from '@/services/formula';

const f = (name: string, formula: string | null = null) => ({ name, type: formula ? ('formula' as const) : ('number' as const), formula });

describe('règles de définition des champs', () => {
  it('accepte un ensemble valide', () => {
    expect(() => assertFieldSet([f('Quantité'), f('Prix'), f('Total', '{Quantité} * {Prix}')])).not.toThrow();
  });

  it('refuse noms vides, doublons (casse ignorée) et accolades', () => {
    expect(() => assertFieldSet([f('  ')])).toThrow(FieldDefinitionError);
    expect(() => assertFieldSet([f('Prix'), f('prix ')])).toThrow('Un champ « prix » existe déjà');
    expect(() => assertFieldSet([f('{x}')])).toThrow(FieldDefinitionError);
  });

  it('refuse formule vide, invalide, référence inconnue ou circulaire', () => {
    expect(() => assertFieldSet([{ name: 'T', type: 'formula', formula: ' ' }])).toThrow("n'a pas de formule");
    expect(() => assertFieldSet([f('T', '1 +')])).toThrow('T : Formule incomplète');
    expect(() => assertFieldSet([f('T', '{Inconnu} * 2')])).toThrow('champ introuvable {Inconnu}');
    expect(() => assertFieldSet([f('A', '{B}'), f('B', '{A}')])).toThrow('Référence circulaire');
  });

  it('liste les champs calculés qui dépendent d’un champ', () => {
    const all = [f('Qté'), f('Prix'), f('Total', '{Qté} * {Prix}'), f('TVA', '{Total} * 20%')];
    expect(dependentsOf(all, 'Qté')).toEqual(['Total']);
    expect(dependentsOf(all, 'Total')).toEqual(['TVA']);
    expect(dependentsOf(all, 'TVA')).toEqual([]);
  });

  it('répercute un renommage dans une formule', () => {
    expect(renameRef('{Qté} * { Qté } + {Qté totale}', 'Qté', 'Quantité')).toBe('{Quantité} * {Quantité} + {Qté totale}');
    expect(renameRef('{Prix (Ar)} * 2', 'Prix (Ar)', 'Prix')).toBe('{Prix} * 2');
  });
});
