import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { DataValue, Value } from '../types/value';
import { checkedZip } from '../utils/utils';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeDataValues(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  dataValue: DataValue,
  other: Value,
): InferredType[] {
  if (other.kind !== 'DataValue' || other.parameters.length !== dataValue.parameters.length) {
    return mismatchResult(messageState, state, dataValue, other);
  }

  return [
    ...convergeValuesWithState(messageState, state, dataValue.name, other.name),
    ...checkedZip(dataValue.parameters, other.parameters)
      .flatMap(([left, right]) => convergeValuesWithState(messageState, state, left, right)),
  ];
}
