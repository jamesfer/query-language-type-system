import { TypedNode } from './type-check';
import { Expression } from './types/expression';
import { Value } from './types/value';
export declare function unfoldParameters(value: Value): Generator<[boolean, Value, Value]>;
export declare function unfoldExplicitParameters(value: Value): Generator<[Value, Value, Value[]]>;
interface Visitor<T> {
    before?(t: T): T;
    after?(t: T): T;
}
export declare const visitExpressionNodes: (visitor: Visitor<TypedNode>) => (expression: Expression<TypedNode>) => Expression<TypedNode>;
export declare const visitNodes: (visitor: Visitor<TypedNode>) => (node: TypedNode) => TypedNode;
export declare const visitAndTransformExpression: <T>(visitor: (value: Expression<T>) => T extends void ? Expression<void> : T) => (expression: Expression<void>) => T extends void ? Expression<void> : T;
export declare const visitAndTransformExpressionBefore: <T>(visitor: (value: T extends void ? Expression<void> : T) => Expression<T>) => (expression: T extends void ? Expression<void> : T) => Expression<void>;
export declare const visitChildValues: (visitor: Visitor<Value<void>>) => (value: Value<void>) => Value<void>;
export declare const visitValue: (visitor: Visitor<Value<void>>) => (value: Value<void>) => Value<void>;
export declare const visitAndTransformValue: <T>(visitor: (value: Value<T>) => T extends void ? Value<void> : T) => (value: Value<void>) => T extends void ? Value<void> : T;
export declare const visitValueForState: <S>(initial: S, visitor: Visitor<[S, Value<void>]>) => (value: Value<void>) => S;
export declare const visitValueWithState: <S>(initial: S, visitor: Visitor<[S, Value<void>]>) => (value: Value<void>) => Value<void>;
export {};
//# sourceMappingURL=visitor-utils.d.ts.map