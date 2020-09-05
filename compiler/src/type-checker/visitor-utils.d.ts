import { Expression } from './types/expression';
import { Node, NodeWithChild, NodeWithExpression } from './types/node';
import { Value } from './types/value';
export declare function unfoldParameters(value: Value): Generator<[boolean, Value, Value]>;
export declare function unfoldExplicitParameters(value: Value): Generator<[Value, Value, Value[]]>;
interface Visitor<T> {
    before?(t: T): T;
    after?(t: T): T;
}
export declare const visitExpressionNodes: <T>(visitor: Visitor<Node<T>>) => (expression: Expression<Node<T>>) => Expression<Node<T>>;
export declare const visitNodes: <T>(visitor: Visitor<Node<T>>) => (node: Node<T>) => Node<T>;
export declare const visitAndTransformNode: <D, B>(visitor: (value: NodeWithChild<D, B>) => B extends void ? Expression<void> : B) => (node: Node<D>) => B extends void ? Expression<void> : B;
export declare const visitAndTransformChildExpression: <A, T>(callback: (expression: A extends void ? Expression<void> : A) => T extends void ? Expression<void> : T) => (expression: Expression<A>) => Expression<T>;
export declare const visitAndTransformExpression: <T>(visitor: (value: Expression<T>) => T extends void ? Expression<void> : T) => (expression: Expression) => T extends void ? Expression<void> : T;
export declare const visitAndTransformExpressionBefore: <T>(visitor: (value: T extends void ? Expression<void> : T) => Expression<T>) => (expression: T extends void ? Expression<void> : T) => Expression;
export declare const visitChildValues: (visitor: Visitor<Value>) => (value: Value) => Value;
export declare const visitValue: (visitor: Visitor<Value>) => (value: Value) => Value;
export declare const visitAndTransformValue: <T>(visitor: (value: Value<T>) => T extends void ? Value<void> : T) => (value: Value) => T extends void ? Value<void> : T;
export declare const visitValueForState: <S>(initial: S, visitor: Visitor<[S, Value<void>]>) => (value: Value) => S;
export declare const visitValueWithState: <S>(initial: S, visitor: Visitor<[S, Value<void>]>) => (value: Value) => Value;
export declare function mapNode<D, E, F>(f: (e: E) => F, node: NodeWithExpression<D, E>): NodeWithExpression<D, F>;
export {};
//# sourceMappingURL=visitor-utils.d.ts.map