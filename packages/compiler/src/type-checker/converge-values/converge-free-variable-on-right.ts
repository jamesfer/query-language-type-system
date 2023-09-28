import { FreeVariable, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { inferredType } from './converge-utils';

export function convergeFreeVariableOnRight(
  state: ConvergeState,
  left: Value,
  right: FreeVariable,
): InferredType[] {
  // If the two variables are identical
  if (left.kind === 'FreeVariable' && left.name === right.name) {
    return [];
  }

  // Infer the free variable as the right
  return [inferredType(state, right.name, left)];
}
