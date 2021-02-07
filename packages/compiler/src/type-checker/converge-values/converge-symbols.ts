import { SymbolLiteral, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { mismatchResult } from './converge-utils';

export function convergeSymbols(
  state: ConvergeState,
  symbol: SymbolLiteral,
  other: Value,
): ConvergeResult {
  return other.kind === 'SymbolLiteral' && other.name === symbol.name
    ? [[], []]
    : mismatchResult(state, symbol, other);
}
