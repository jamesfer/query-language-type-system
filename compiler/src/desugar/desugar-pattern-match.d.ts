import { Application, BindingExpression, BooleanExpression, DataInstantiation, Identifier, NativeExpression, NodeWithExpression, NumberExpression, ReadDataPropertyExpression, ReadRecordPropertyExpression, RecordExpression, StringExpression, SymbolExpression } from '..';
import { ResolvedNodeDecoration } from '../type-checker/resolve-implicits';
import { SimpleFunctionExpression } from './desugar-destructuring';
import { DesugaredNode as DualBindingDesugaredNode } from './desugar-dual-bindings';
export declare type DesugaredExpressionWithoutPatternMatch<T = void> = Identifier | BooleanExpression | NumberExpression | StringExpression | SymbolExpression | RecordExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T> | Application<T extends void ? DesugaredExpressionWithoutPatternMatch : T> | SimpleFunctionExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T> | DataInstantiation<T extends void ? DesugaredExpressionWithoutPatternMatch : T> | BindingExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T> | ReadRecordPropertyExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T> | ReadDataPropertyExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T> | NativeExpression;
declare module 'fp-ts/lib/HKT' {
    interface URItoKind<A> {
        readonly ['DesugaredExpressionWithoutPatternMatch']: DesugaredExpressionWithoutPatternMatch<A>;
    }
}
export interface DesugaredNode extends NodeWithExpression<ResolvedNodeDecoration, DesugaredExpressionWithoutPatternMatch<DesugaredNode>> {
}
export declare function desugarPatternMatch(node: DualBindingDesugaredNode): DesugaredNode;
export declare function makePatternMatchDesugaredNodeIterator<A, B>(f: (a: A) => B): (e: DesugaredExpressionWithoutPatternMatch<A>) => DesugaredExpressionWithoutPatternMatch<B>;
export declare function stripDesugaredNodeWithoutPatternMatch(node: DesugaredNode): DesugaredExpressionWithoutPatternMatch;
//# sourceMappingURL=desugar-pattern-match.d.ts.map