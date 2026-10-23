import type { Field } from '@/data/schema';

let n = 0;
export function makeField(partial: Partial<Field> & Pick<Field, 'name' | 'type'>): Field {
  n += 1;
  return {
    id: partial.id ?? `f${n}`,
    tableId: 't1',
    required: false,
    defaultValue: null,
    position: n,
    optionsJson: null,
    validationJson: null,
    formula: null,
    refTableId: null,
    ...partial,
  };
}
