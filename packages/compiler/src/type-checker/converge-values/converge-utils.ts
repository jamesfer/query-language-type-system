import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { valueToString } from '../utils/value-to-string';
import { ConvergeState, InferredType } from './converge-types';

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
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  leftValue: Value,
  rightValue: Value,
): InferredType[] {
  messageState.push(mismatchMessage(state, leftValue, rightValue));
  return [];
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
