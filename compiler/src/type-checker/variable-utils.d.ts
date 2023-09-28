import { Value } from './types/value';
export interface VariableReplacement {
    from: string;
    to: Value;
}
export declare const applyReplacements: (replacements: VariableReplacement[]) => (value: Value) => Value;
export declare function extractFreeVariableNamesFromValue(inputValue: Value): string[];
export declare function getBindingsFromPair(left: Value, right: Value): VariableReplacement[];
export declare const usesVariable: (variables: string[]) => (incomingValue: Value) => boolean;
export declare function areValuesEqual(left: Value, right: Value): boolean;
//# sourceMappingURL=variable-utils.d.ts.map