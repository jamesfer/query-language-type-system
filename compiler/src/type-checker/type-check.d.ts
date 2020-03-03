import { TypeResult } from './monad-utils';
import { Expression } from './types/expression';
import { Node } from './types/node';
import { Scope } from './types/scope';
import { ExplicitValue, Value } from './types/value';
export interface TypedDecoration {
    type: ExplicitValue;
    implicitType: Value;
    scope: Scope;
}
export declare type TypedNode = Node<TypedDecoration>;
export declare const typeExpression: (scope: Scope) => (expression: Expression<void>) => TypeResult<TypedNode>;
//# sourceMappingURL=type-check.d.ts.map