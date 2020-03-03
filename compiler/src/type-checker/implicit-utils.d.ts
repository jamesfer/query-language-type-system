import { TypedNode } from './type-check';
import { ExplicitValue, Value } from './types/value';
export declare const extractImplicitParameters: (node: TypedNode) => Value<void>[];
export declare function extractImplicitsParameters(type: Value): [Value[], Value];
export declare const stripImplicits: (value: Value<void>) => ExplicitValue<void>;
export declare function stripAllImplicits(types: Value[]): ExplicitValue[];
/**
 * Splits a list of values into two lists. The first contains all the values that use at least one
 * free variable in common with relating value. The second shares no free variables.
 */
export declare function partitionUnrelatedValues(valueList: Value[], relatingValue: Value): [Value[], Value[]];
//# sourceMappingURL=implicit-utils.d.ts.map