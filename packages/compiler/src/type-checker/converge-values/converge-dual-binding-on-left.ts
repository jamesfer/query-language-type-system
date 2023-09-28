import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { DualBinding, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { convergeValuesWithState } from './converge-values-with-state';

/**
 * Attempts to converge the left and right sides of the dual binding to the same value.
 */
export function convergeDualBindingOnLeft(
  messagesState: StateRecorder<Message>,
  state: ConvergeState,
  left: DualBinding,
  right: Value,
): InferredType[] {
  return [
    ...convergeValuesWithState(messagesState, state, left.left, right),
    ...convergeValuesWithState(messagesState, state, left.right, right),
  ];
}
