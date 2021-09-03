import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { ImplicitFunctionLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeImplicitFunctions(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  implicitFunction: ImplicitFunctionLiteral,
  other: Value,
): InferredType[] {
  if (other.kind !== 'ImplicitFunctionLiteral') {
    return mismatchResult(messageState, state, implicitFunction, other);
  }

  return [
    ...convergeValuesWithState(
      messageState,
      { ...state, direction: 'leftSpecific' },
      implicitFunction.parameter,
      other.parameter,
    ),
    ...convergeValuesWithState(
      messageState,
      state,
      implicitFunction.body,
      other.body,
    ),
  ];
}
