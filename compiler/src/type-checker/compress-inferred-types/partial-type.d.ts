import { InferredTypeOperator } from '../types/inferred-type';
import { Value } from '../types/value';
export interface PartialType {
    operator: InferredTypeOperator;
    to: Value;
}
export declare function equalsPartialType(to: Value): PartialType;
export interface NamedPartialType {
    operator: InferredTypeOperator;
    from: string;
    to: Value;
}
export declare function evaluatesToPartialType(from: string, to: Value): NamedPartialType;
//# sourceMappingURL=partial-type.d.ts.map