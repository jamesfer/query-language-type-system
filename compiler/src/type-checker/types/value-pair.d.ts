import { Expression } from './expression';
import { Value } from './value';
export interface ValueAndExpression {
    value: Value;
    expression: Expression;
}
/**
 * Evaluated pairs are compared after implicit parameters from the right side are removed.
 */
export interface EvaluatedPair {
    kind: 'Evaluated';
    left: ValueAndExpression;
    right: ValueAndExpression;
}
/**
 * Exact pairs are compared without removing any implicit parameters.
 */
export interface ExactPair {
    kind: 'Exact';
    left: ValueAndExpression;
    right: ValueAndExpression;
}
export declare type ValuePair = EvaluatedPair | ExactPair;
export declare function evaluatedPair(left: ValueAndExpression, right: ValueAndExpression): EvaluatedPair;
export declare function exactPair(left: ValueAndExpression, right: ValueAndExpression): ExactPair;
//# sourceMappingURL=value-pair.d.ts.map