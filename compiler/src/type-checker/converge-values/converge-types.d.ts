import { Expression } from '../types/expression';
import { Value } from '../types/value';
export declare type ConvergeDirection = 'either' | 'leftSpecific';
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
    originatingExpression: Expression;
    inferringExpression: Expression;
}
export declare type ConvergeResult = InferredType[];
//# sourceMappingURL=converge-types.d.ts.map