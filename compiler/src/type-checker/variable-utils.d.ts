import { TypedNode } from './type-check';
import { Expression } from './types/expression';
import { Scope } from './types/scope';
import { Value } from './types/value';
export interface VariableReplacement {
    from: string;
    to: Value;
}
export declare const applyReplacements: (replacements: VariableReplacement[]) => (value: Value<void>) => Value<void>;
export declare const recursivelyApplyReplacementsToNode: (replacements: VariableReplacement[]) => ({ expression, decoration }: TypedNode) => TypedNode;
export declare const recursivelyApplyReplacements: (replacements: VariableReplacement[]) => (expression: Expression<TypedNode>) => Expression<TypedNode>;
export declare function extractFreeVariableNames(inputValue: Value): string[];
export declare function nextFreeName(taken: string[], prefix?: string): string;
export declare function renameTakenVariables(takenVariables: string[], replacements: VariableReplacement[]): VariableReplacement[];
export declare function getBindingsFromValue(value: Value): VariableReplacement[];
export declare function getBindingsFromPair(left: Value, right: Value): VariableReplacement[];
export declare const usesVariable: (variables: string[]) => (incomingValue: Value<void>) => boolean;
export declare const substituteVariables: (scope: Scope) => (value: Value<void>) => Value<void>;
export declare function areValuesEqual(left: Value, right: Value): boolean;
export declare function applyParameter(parameter: Value, func: Value): Value;
//# sourceMappingURL=variable-utils.d.ts.map