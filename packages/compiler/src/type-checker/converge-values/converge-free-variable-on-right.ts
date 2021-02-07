import { FreeVariable, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { inferredType } from './converge-utils';

export function convergeFreeVariableOnRight(
  state: ConvergeState,
  left: Value,
  right: FreeVariable,
): ConvergeResult {
  // If the two variables are identical
  if (left.kind === 'FreeVariable' && left.name === right.name) {
    return [[], []];
  }

  // Infer the free variable as the right
  return [[], [inferredType(state, right.name, left)]];
}
