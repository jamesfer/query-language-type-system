import { FunctionLiteral, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { join, mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeFunctions(
  state: ConvergeState,
  functionValue: FunctionLiteral,
  other: Value,
): ConvergeResult {
  if (other.kind !== 'FunctionLiteral') {
    return mismatchResult(state, functionValue, other);
  }

  return join([
    convergeValuesWithState(state, functionValue.parameter, other.parameter),
    convergeValuesWithState(state, functionValue.body, other.body),
  ]);
}
