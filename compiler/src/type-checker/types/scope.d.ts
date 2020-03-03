import { Expression } from './expression';
import { Value } from './value';
export interface ScopeBinding {
    kind: 'ScopeBinding';
    name: string;
    type: Value;
    scope: Scope;
    expression?: Expression;
}
export interface Scope {
    bindings: ScopeBinding[];
}
//# sourceMappingURL=scope.d.ts.map