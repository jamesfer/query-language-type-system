import { ImplicitFunctionLiteral, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { join, mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeImplicitFunctions(
  state: ConvergeState,
  implicitFunction: ImplicitFunctionLiteral,
  other: Value,
): ConvergeResult {
  if (other.kind === 'ImplicitFunctionLiteral') {
    return join([
      convergeValuesWithState(
        { ...state, direction: 'leftSpecific' },
        implicitFunction.parameter,
        other.parameter,
      ),
      convergeValuesWithState(state, implicitFunction.body, other.body),
    ]);
  }

  return mismatchResult(state, implicitFunction, other);
}
