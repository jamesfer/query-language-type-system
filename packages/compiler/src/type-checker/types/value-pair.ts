import { Expression } from './expression';
import { Value } from './value';

export interface ValueAndExpression {
  value: Value;
  expression: Expression;
}

/**
 * Evaluated pairs are compared after implicit parameters from the right side are removed.
 */
export interface EvaluatedPair {
  kind: 'Evaluated';
  left: ValueAndExpression;
  right: ValueAndExpression;
}

/**
 * Exact pairs are compared without removing any implicit parameters.
 */
export interface ExactPair {
  kind: 'Exact';
  left: ValueAndExpression;
  right: ValueAndExpression;
}

export type ValuePair = EvaluatedPair | ExactPair;

export function evaluatedPair(left: ValueAndExpression, right: ValueAndExpression): EvaluatedPair {
  return { kind: 'Evaluated', left, right };
}

export function exactPair(left: ValueAndExpression, right: ValueAndExpression): ExactPair {
  return { kind: 'Exact', left, right };
}
