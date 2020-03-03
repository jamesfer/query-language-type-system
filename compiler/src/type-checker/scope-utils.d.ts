import { EvaluationScope } from './types/evaluation-scope';
import { Scope, ScopeBinding } from './types/scope';
import { Value } from './types/value';
import { VariableReplacement } from './variable-utils';
export declare function findMatchingImplementations(scope: Scope, value: Value): ScopeBinding[];
export declare function scopeToEScope(scope: Scope): EvaluationScope;
export declare function expandScopeWithReplacements(scope: EvaluationScope, replacements: VariableReplacement[]): {
    bindings: (import("./types/evaluation-scope").EScopeBinding | import("./types/evaluation-scope").EScopeShapeBinding)[];
};
export declare function addReplacementsToScope(scope: Scope, replacements: VariableReplacement[]): Scope;
export declare function findBinding(scope: Scope, name: string): ScopeBinding | undefined;
//# sourceMappingURL=scope-utils.d.ts.map