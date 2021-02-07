import { flatten } from 'lodash';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { unzip } from '../utils';
import { valueToString } from '../utils/value-to-string';
import { ConvergeResult, ConvergeState, InferredType } from './converge-types';

export function join(results: ConvergeResult[]): ConvergeResult {
  const [allMessages, allInferredTypes] = unzip(results);
  return [flatten(allMessages), flatten(allInferredTypes)];
}

export function mismatchMessage(
  state: ConvergeState,
  leftValue: Value,
  rightValue: Value,
): Message {
  const leftValueString = valueToString(leftValue);
  const leftEntireValueString = valueToString(state.leftEntireValue);
  const rightValueString = valueToString(rightValue);
  const rightEntireValueString = valueToString(state.rightEntireValue);
  return `Type mismatch between ${leftValueString} and ${rightValueString} in context ${leftEntireValueString} and ${rightEntireValueString}`;
}

export function mismatchResult(
  state: ConvergeState,
  leftValue: Value,
  rightValue: Value,
): ConvergeResult {
  return [[mismatchMessage(state, leftValue, rightValue)], []];
}

export function inferredType(
  state: ConvergeState,
  from: string,
  to: Value,
): InferredType {
  return {
    from,
    to,
    originatingExpression: state.leftExpression,
    inferringExpression: state.rightExpression,
  };
}
