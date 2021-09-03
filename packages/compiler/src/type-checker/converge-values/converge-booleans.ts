import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { BooleanLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';

export function convergeBooleans(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  boolean: BooleanLiteral,
  other: Value,
): InferredType[] {
  return other.kind === 'BooleanLiteral' && other.value === boolean.value
    ? []
    : mismatchResult(messageState, state, boolean, other);
}
