import { InferredTypeOperator } from '../types/inferred-type';
import { Value } from '../types/value';

export interface PartialType {
  operator: InferredTypeOperator;
  to: Value;
}

export function equalsPartialType(to: Value): PartialType {
  return { to, operator: 'Equals' };
}

export interface NamedPartialType {
  operator: InferredTypeOperator;
  from: string;
  to: Value;
}

export function evaluatesToPartialType(from: string, to: Value): NamedPartialType {
  return { from, to, operator: 'EvaluatesTo' };
}
