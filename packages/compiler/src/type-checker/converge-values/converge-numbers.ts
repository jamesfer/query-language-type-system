import { NumberLiteral, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { mismatchResult } from './converge-utils';

export function convergeNumbers(
  state: ConvergeState,
  number: NumberLiteral,
  other: Value,
): ConvergeResult {
  return other.kind === 'NumberLiteral' && other.value === number.value
    ? [[], []]
    : mismatchResult(state, number, other);
}
