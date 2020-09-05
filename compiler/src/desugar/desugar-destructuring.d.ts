import { Application, BindingExpression, BooleanExpression, DataInstantiation, DualExpression, Expression, Identifier, NativeExpression, NodeWithExpression, NumberExpression, PatternMatchExpression, ReadDataPropertyExpression, ReadRecordPropertyExpression, RecordExpression, StringExpression, SymbolExpression, TypedNode } from '..';
import { TypedDecoration } from '../type-checker/type-check';
export interface SimpleFunctionExpression<T = Expression> {
    kind: 'SimpleFunctionExpression';
    parameter: string;
    implicit: boolean;
    body: T;
}
export declare type DesugaredExpressionWithoutDestructuring<T = void> = Identifier | BooleanExpression | NumberExpression | StringExpression | SymbolExpression | RecordExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T> | Application<T extends void ? DesugaredExpressionWithoutDestructuring : T> | SimpleFunctionExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T> | DataInstantiation<T extends void ? DesugaredExpressionWithoutDestructuring : T> | BindingExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T> | DualExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T> | ReadRecordPropertyExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T> | ReadDataPropertyExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T> | PatternMatchExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T> | NativeExpression;
declare module 'fp-ts/lib/HKT' {
    interface URItoKind<A> {
        readonly ['SimpleFunctionExpression']: SimpleFunctionExpression<A>;
        readonly ['DesugaredExpressionWithoutDestructuring']: DesugaredExpressionWithoutDestructuring<A>;
    }
}
export interface DesugaredNode extends NodeWithExpression<TypedDecoration, DesugaredExpressionWithoutDestructuring<DesugaredNode>> {
}
export interface PartiallyDesugaredNode extends NodeWithExpression<TypedDecoration, Expression<DesugaredNode>> {
}
export declare function desugarDestructuring(node: TypedNode): DesugaredNode;
export declare function simpleFunctionMapIterator<A, B>(f: (a: A) => B): (expression: SimpleFunctionExpression<A>) => SimpleFunctionExpression<B>;
export declare function makeDesugaredNodeIterator<A, B>(f: (a: A) => B): (e: DesugaredExpressionWithoutDestructuring<A>) => DesugaredExpressionWithoutDestructuring<B>;
//# sourceMappingURL=desugar-destructuring.d.ts.map