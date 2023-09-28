import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { SymbolLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';

export function convergeSymbols(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  symbol: SymbolLiteral,
  other: Value,
): InferredType[] {
  return other.kind === 'SymbolLiteral' && other.name === symbol.name
    ? []
    : mismatchResult(messageState, state, symbol, other);
}
