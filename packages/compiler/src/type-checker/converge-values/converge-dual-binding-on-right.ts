import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { DualBinding, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { convergeValuesWithState } from './converge-values-with-state';

/**
 * Attempts to converge the left and right sides of the dual binding to the same value.
 */
export function convergeDualBindingOnRight(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  left: Value,
  right: DualBinding,
): InferredType[] {
  return [
    ...convergeValuesWithState(messageState, state, left, right.left),
    ...convergeValuesWithState(messageState, state, left, right.right),
  ];
}
