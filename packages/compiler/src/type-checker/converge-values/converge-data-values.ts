import { DataValue, Value } from '../types/value';
import { checkedZipWith } from '../utils';
import { ConvergeResult, ConvergeState } from './converge-types';
import { join, mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeDataValues(
  state: ConvergeState,
  dataValue: DataValue,
  other: Value,
): ConvergeResult {
  if (other.kind !== 'DataValue' || other.parameters.length !== dataValue.parameters.length) {
    return mismatchResult(state, dataValue, other);
  }

  return join([
    convergeValuesWithState(state, dataValue.name, other.name),
    ...checkedZipWith(dataValue.parameters, other.parameters, (leftParameter, rightParameter) => (
      convergeValuesWithState(state, leftParameter, rightParameter)
    )),
  ]);
}
