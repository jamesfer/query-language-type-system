import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { Expression } from '../types/expression';
import { InferredType } from '../types/inferred-type';
import { NodeWithChild } from '../types/node';
import { Value } from '../types/value';
export interface NamedNodeDecoration {
    shapeName: string;
    type: Value;
}
export declare type NamedNode<T = void> = NodeWithChild<NamedNodeDecoration, T extends void ? NamedNode : T>;
export declare function attachShapes(makeUniqueId: UniqueIdGenerator, expression: Expression): [InferredType[], NamedNode];
//# sourceMappingURL=index.d.ts.map