import { TypedNode } from '../type-check';
import { Value } from './value';
export interface ScopeBinding {
    kind: 'ScopeBinding';
    name: string;
    type: Value;
    scope: Scope;
    node?: TypedNode;
}
export interface Scope {
    bindings: ScopeBinding[];
}
//# sourceMappingURL=scope.d.ts.map