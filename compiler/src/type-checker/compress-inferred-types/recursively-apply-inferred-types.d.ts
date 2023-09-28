import { NamedNode } from '../attach-shapes';
import { NodeWithChild } from '../types/node';
import { Value } from '../types/value';
import { SimplifiedInferredTypeMap } from '../simplify-collapsed-types/simplify-collapsed-types';
export interface ShapedNodeDecoration {
    /**
     * The type of the node that should be shown to users.
     */
    type: Value;
    /**
     * The expected type of the node after implicits were removed.
     */
    shape: Value;
}
export declare type ShapedNode<T = void> = NodeWithChild<ShapedNodeDecoration, T extends void ? ShapedNode : T>;
export declare function recursivelyApplyInferredTypes(inferredTypes: SimplifiedInferredTypeMap): (node: NamedNode) => ShapedNode;
//# sourceMappingURL=recursively-apply-inferred-types.d.ts.map