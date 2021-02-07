import { DualBinding, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { join } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

/**
 * Attempts to converge the left and right sides of the dual binding to the same value.
 */
export function convergeDualBindingOnRight(
  state: ConvergeState,
  left: Value,
  right: DualBinding,
): ConvergeResult {
  return join([
    convergeValuesWithState(state, left, right.left),
    convergeValuesWithState(state, left, right.right),
  ]);
}
