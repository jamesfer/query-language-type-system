import { ShapedNode } from '../compress-inferred-types/recursively-apply-inferred-types';
import { NodeWithChild } from '../types/node';
import { Value } from '../types/value';
export interface Scope {
    bindings: {
        [k: string]: Value;
    };
}
export interface ScopedNodeDecoration {
    type: Value;
    shape: Value;
    scope: Scope;
}
export declare type ScopedNode<T = void> = NodeWithChild<ScopedNodeDecoration, T extends void ? ScopedNode : T>;
export declare function buildScopedNode(node: ShapedNode): ScopedNode;
//# sourceMappingURL=index.d.ts.map