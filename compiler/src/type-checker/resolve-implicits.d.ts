import { TypedNode } from './type-check';
import { Message } from './types/message';
export declare function shallowResolveImplicitParameters(typedNode: TypedNode, allowedUnresolved?: boolean): [Message[], TypedNode];
export declare function resolveImplicitParameters(node: TypedNode): [string[], TypedNode];
//# sourceMappingURL=resolve-implicits.d.ts.map