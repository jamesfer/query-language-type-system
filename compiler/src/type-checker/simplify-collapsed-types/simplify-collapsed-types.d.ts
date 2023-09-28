import { CollapsedInferredTypeMap } from '../types/inferred-type';
import { Value } from '../types/value';
export interface SimplifiedInferredType {
    from: string;
    to: Value;
}
export declare type SimplifiedInferredTypeMap = {
    [k: string]: SimplifiedInferredType;
};
export declare function simplifyCollapsedTypes(collapsedTypes: CollapsedInferredTypeMap): SimplifiedInferredTypeMap;
//# sourceMappingURL=simplify-collapsed-types.d.ts.map