import { Application, BindingExpression, BooleanExpression, DataInstantiation, Identifier, NativeExpression, NodeWithExpression, NumberExpression, PatternMatchExpression, ReadDataPropertyExpression, ReadRecordPropertyExpression, RecordExpression, StringExpression, SymbolExpression } from '..';
import { TypedDecoration } from '../type-checker/type-check';
import { SimpleFunctionExpression, DesugaredNode as DestructuringDesugaredNode } from './desugar-destructuring';
export declare type DesugaredExpressionWithoutDualExpression<T = void> = Identifier | BooleanExpression | NumberExpression | StringExpression | SymbolExpression | RecordExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T> | Application<T extends void ? DesugaredExpressionWithoutDualExpression : T> | SimpleFunctionExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T> | DataInstantiation<T extends void ? DesugaredExpressionWithoutDualExpression : T> | BindingExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T> | ReadRecordPropertyExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T> | ReadDataPropertyExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T> | PatternMatchExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T> | NativeExpression;
declare module 'fp-ts/lib/HKT' {
    interface URItoKind<A> {
        readonly ['DesugaredExpressionWithoutDualExpression']: DesugaredExpressionWithoutDualExpression<A>;
    }
}
export interface DesugaredNode extends NodeWithExpression<TypedDecoration, DesugaredExpressionWithoutDualExpression<DesugaredNode>> {
}
export declare function desugarDualBindings(node: DestructuringDesugaredNode): DesugaredNode;
export declare function makeDualBindingDesugaredNodeIterator<A, B>(f: (a: A) => B): (e: DesugaredExpressionWithoutDualExpression<A>) => DesugaredExpressionWithoutDualExpression<B>;
//# sourceMappingURL=desugar-dual-bindings.d.ts.map