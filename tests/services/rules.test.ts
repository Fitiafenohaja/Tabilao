import { applyEffect, invertEffect, parseRuleAction, ruleEffect, type RuleAction } from '@/services/rules';

const action: RuleAction = {
  kind: 'adjust',
  sourceRefFieldId: 'product',
  sourceAmountFieldId: 'qty',
  targetFieldId: 'stock',
  operation: 'decrement',
};

describe('règles entre tableaux (vente → stock)', () => {
  it('une vente de 3 diminue le stock de 3', () => {
    const effect = ruleEffect(action, { product: 'rec-savon', qty: 3 })!;
    expect(effect).toEqual({ targetRecordId: 'rec-savon', targetFieldId: 'stock', delta: -3 });
    expect(applyEffect({ stock: 10 }, effect)).toEqual({ stock: 7 });
    expect(applyEffect({ stock: 7 }, invertEffect(effect))).toEqual({ stock: 10 });
  });

  it('ignore une ligne sans référence ni quantité', () => {
    expect(ruleEffect(action, { qty: 3 })).toBeNull();
    expect(ruleEffect(action, { product: 'x', qty: null })).toBeNull();
  });

  it('parse action_json de façon sûre', () => {
    expect(parseRuleAction(JSON.stringify(action))).toEqual(action);
    expect(parseRuleAction('pas du json')).toBeNull();
  });
});
