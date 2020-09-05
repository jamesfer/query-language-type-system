import { TypeResult } from './monad-utils';
import { Expression } from './types/expression';
import { Node } from './types/node';
import { Scope } from './types/scope';
import { ExplicitValue, Value } from './types/value';
import { UniqueIdGenerator } from './utils';
export interface TypedDecoration {
    type: ExplicitValue;
    implicitType: Value;
    scope: Scope;
}
export declare type TypedNode = Node<TypedDecoration>;
export declare const typeExpression: (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (expression: Expression) => TypeResult<TypedNode>;
//# sourceMappingURL=type-check.d.ts.map