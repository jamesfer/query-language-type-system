import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { FunctionLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeFunctions(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  functionValue: FunctionLiteral,
  other: Value,
): InferredType[] {
  if (other.kind !== 'FunctionLiteral') {
    return mismatchResult(messageState, state, functionValue, other);
  }

  return [
    ...convergeValuesWithState(messageState, state, functionValue.parameter, other.parameter),
    ...convergeValuesWithState(messageState, state, functionValue.body, other.body),
  ];
}
