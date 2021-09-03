import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { NumberLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';

export function convergeNumbers(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  number: NumberLiteral,
  other: Value,
): InferredType[] {
  return other.kind === 'NumberLiteral' && other.value === number.value
    ? []
    : mismatchResult(messageState, state, number, other);
}
