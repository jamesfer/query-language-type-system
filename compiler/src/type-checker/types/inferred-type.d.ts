import { Expression } from './expression';
import { Value } from './value';
export declare type InferredTypeOperator = 'Equals' | 'EvaluatesTo' | 'EvaluatedFrom';
export interface InferredType {
    operator: InferredTypeOperator;
    from: string;
    to: Value;
    origin: Expression;
    inferrer: Expression;
}
export interface CollapsedInferredType {
    operator: InferredTypeOperator;
    from: string;
    to: Value;
    sources: InferredType[];
}
export declare type CollapsedInferredTypeMap = {
    [k: string]: CollapsedInferredType;
};
export declare function makeInferredType(operator: InferredTypeOperator, from: string, to: Value, origin: Expression, inferrer: Expression): InferredType;
export declare function makeCollapsedInferredType(inferredType: InferredType): CollapsedInferredType;
//# sourceMappingURL=inferred-type.d.ts.map