import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { ApplicationValue, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeApplications(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  application: ApplicationValue,
  other: Value,
): InferredType[] {
  switch (other.kind) {
    case 'ApplicationValue':
      return [
        ...convergeValuesWithState(messageState, state, application.callee, other.callee),
        ...convergeValuesWithState(messageState, state, application.parameter, other.parameter),
      ];

    case 'DataValue':
      if (other.parameters.length === 0) {
        return mismatchResult(messageState, state, application, other);
      }

      return [
        ...convergeValuesWithState(
          messageState,
          state,
          application.callee,
          {
            ...other,
            parameters: other.parameters.slice(0, -1),
          },
        ),
        ...convergeValuesWithState(
          messageState,
          state,
          application.parameter,
          other.parameters[other.parameters.length - 1],
        ),
      ];

    default:
      return mismatchResult(messageState, state, application, other);
  }
}
