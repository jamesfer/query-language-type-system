import { StringLiteral, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { mismatchResult } from './converge-utils';

export function convergeStrings(
  state: ConvergeState,
  string: StringLiteral,
  other: Value,
): ConvergeResult {
  return other.kind === 'StringLiteral' && other.value === string.value
    ? [[], []]
    : mismatchResult(state, string, other);
}
