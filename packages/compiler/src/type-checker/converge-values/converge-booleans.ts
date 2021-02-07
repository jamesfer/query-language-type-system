import { BooleanLiteral, Value } from '../types/value';
import { ConvergeResult, ConvergeState } from './converge-types';
import { mismatchResult } from './converge-utils';

export function convergeBooleans(
  state: ConvergeState,
  boolean: BooleanLiteral,
  other: Value,
): ConvergeResult {
  return other.kind === 'BooleanLiteral' && other.value === boolean.value
    ? [[], []]
    : mismatchResult(state, boolean, other);
}
