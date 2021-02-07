import { Expression } from '../types/expression';
import { Value } from '../types/value';
import { ConvergeDirection, ConvergeResult, ConvergeState } from './converge-types';
import { convergeValuesWithState } from './converge-values-with-state';

/**
 * Compares two types and attempts to reconcile them. Conflicts produce error messages. Free type variables produce
 * `InferredType` annotations when their type can be narrowed to one in the counterpart. `convergeValues` does not
 * guarantee that conflicting `InferredType`s will not be generated. It is the responsibility of the caller to compress
 * the inferred types which will reveal conflicts.
 */
export function convergeValues(
  leftValue: Value,
  leftExpression: Expression,
  rightValue: Value,
  rightExpression: Expression,
  direction: ConvergeDirection = 'either',
): ConvergeResult {
  const state: ConvergeState = {
    direction,
    leftExpression,
    rightExpression,
    leftEntireValue: leftValue,
    rightEntireValue: rightValue,
  };
  return convergeValuesWithState(state, leftValue, rightValue);
}
