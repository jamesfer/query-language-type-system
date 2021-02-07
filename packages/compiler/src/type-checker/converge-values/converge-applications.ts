import { ApplicationValue, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { join, mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeApplications(
  state: ConvergeState,
  application: ApplicationValue,
  other: Value,
): ConvergeResult {
  switch (other.kind) {
    case 'ApplicationValue': {
      return join([
        convergeValuesWithState(state, application.callee, other.callee),
        convergeValuesWithState(state, application.parameter, other.parameter),
      ]);
    }
    case 'DataValue': {
      if (other.parameters.length === 0) {
        return mismatchResult(state, application, other);
      }

      return join([
        convergeValuesWithState(state, application.callee, {
          ...other,
          parameters: other.parameters.slice(0, -1),
        }),
        convergeValuesWithState(state, application.parameter, other.parameters[other.parameters.length - 1]),
      ]);
    }
    default:
      return mismatchResult(state, application, other);
  }
}
