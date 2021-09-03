import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { StringLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';

export function convergeStrings(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  string: StringLiteral,
  other: Value,
): InferredType[] {
  return other.kind === 'StringLiteral' && other.value === string.value
    ? []
    : mismatchResult(messageState, state, string, other);
}
