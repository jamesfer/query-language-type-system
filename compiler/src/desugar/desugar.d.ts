import { TypedNode } from '..';
import { DesugaredNode, DesugaredExpressionWithoutPatternMatch } from './desugar-pattern-match';
export declare type CoreExpression<T = void> = DesugaredExpressionWithoutPatternMatch<T>;
export declare type CoreNode = DesugaredNode;
export declare function desugar(node: TypedNode): CoreNode;
export declare function stripCoreNode(node: CoreNode): CoreExpression;
//# sourceMappingURL=desugar.d.ts.map