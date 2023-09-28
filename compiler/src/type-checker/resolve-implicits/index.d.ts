import { Message, Node } from '../..';
import { Scope, ScopedNode } from '../build-scoped-node';
import { Value } from '../types/value';
export interface ResolvedNodeDecoration {
    /**
     * The type of the node that should be shown to users.
     */
    type: Value;
    /**
     * Name of other nodes used to satisfy this nodes implicits.
     */
    resolvedImplicits: [string, Value][];
    scope: Scope;
}
export declare type ResolvedNode = Node<ResolvedNodeDecoration>;
export declare function resolveImplicits(node: ScopedNode): [Message[], ResolvedNode];
//# sourceMappingURL=index.d.ts.map