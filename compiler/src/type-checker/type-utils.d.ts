import { Message } from './types/message';
import { Scope } from './types/scope';
import { FreeVariable, Value } from './types/value';
import { VariableReplacement } from './variable-utils';
/**
 * Looks at two values and tries to infer as much information about the free variables as possible
 * based on any corresponding value in the value. Returns undefined if the two parameters are not
 * compatible.
 */
export declare function converge(scope: Scope, shape: Value, child: Value): VariableReplacement[] | undefined;
/**
 * Runs `converge` but then adds the generated replacements to the scope and just returns true or
 * false based on whether the values could be converged.
 */
/**
 * Looks at all the free variables in the shape and generates an expression represents each variable
 * based on value.
 */
export declare function destructureValue(shape: Value, value: Value): VariableReplacement[] | undefined;
export declare function canSatisfyShape(scope: Scope, shape: Value, child: Value): VariableReplacement[] | undefined;
export declare function areAllPairsSubtypes(scope: Scope, pairGenerator: Iterable<[Value, Value]>, onFailure: (constraint: Value, parameter: Value, index: number) => Message): [Message[], VariableReplacement[]];
export declare function newFreeVariable(prefix: string): FreeVariable;
//# sourceMappingURL=type-utils.d.ts.map