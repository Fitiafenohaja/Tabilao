import { findCycle, parse } from '@/services/formula';
import { TEMPLATES } from '@/templates';

describe('modèles prédéfinis', () => {
  it.each(TEMPLATES.map((t) => [t.id, t] as const))('%s : formules valides, références existantes', (_, template) => {
    const names = new Set(template.fields.map((f) => f.name));
    const formulas: Record<string, string> = {};
    for (const f of template.fields.filter((f) => f.type === 'formula')) {
      expect(f.formula).toBeTruthy();
      parse(f.formula!);
      for (const ref of f.formula!.match(/\{([^}]+)\}/g) ?? []) expect(names).toContain(ref.slice(1, -1));
      formulas[f.name] = f.formula!;
    }
    expect(findCycle(formulas)).toBeNull();
  });
});
