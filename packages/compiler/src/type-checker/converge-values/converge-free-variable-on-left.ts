import { FreeVariable, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { inferredType, mismatchResult } from './converge-utils';

/**
 * Converges a free variable with a concrete type to produce an `InferredType` annotation
 */
export function convergeFreeVariableOnLeft(
  state: ConvergeState,
  left: FreeVariable,
  right: Value,
): ConvergeResult {
  // If the two variables are identical
  if (right.kind === 'FreeVariable' && right.name === left.name) {
    return [[], []];
  }

  if (state.direction === 'either') {
    return [[], [inferredType(state, left.name, right)]];
  }

  return mismatchResult(state, left, right);
}
