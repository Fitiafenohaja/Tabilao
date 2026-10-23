export type FormulaErrorCode =
  | 'syntax'
  | 'unknown_function'
  | 'unknown_ref'
  | 'div_zero'
  | 'type'
  | 'too_deep'
  | 'circular';

/** Erreur affichée sous le champ : `message` est en français clair. */
export class FormulaError extends Error {
  constructor(
    readonly code: FormulaErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'FormulaError';
  }
}
