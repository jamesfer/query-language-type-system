import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { FreeVariable, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { inferredType, mismatchResult } from './converge-utils';

/**
 * Converges a free variable with a concrete type to produce an `InferredType` annotation
 */
export function convergeFreeVariableOnLeft(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  left: FreeVariable,
  right: Value,
): InferredType[] {
  // If the two variables are identical
  if (right.kind === 'FreeVariable' && right.name === left.name) {
    return [];
  }

  if (state.direction === 'either') {
    return [inferredType(state, left.name, right)];
  }

  return mismatchResult(messageState, state, left, right);
}
