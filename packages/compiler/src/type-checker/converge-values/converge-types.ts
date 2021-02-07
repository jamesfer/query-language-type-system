import { Expression } from '../types/expression';
import { Message } from '../types/message';
import { Value } from '../types/value';

export type ConvergeDirection = 'either' | 'leftSpecific';

export interface ConvergeState {
  direction: ConvergeDirection;
  leftEntireValue: Value;
  leftExpression: Expression;
  rightEntireValue: Value;
  rightExpression: Expression;
}

export interface InferredType {
  from: string;
  to: Value;
  // TODO Does this maybe need to be a node instead?
  originatingExpression: Expression;
  inferringExpression: Expression;
}

export type ConvergeResult = [Message[], InferredType[]];
