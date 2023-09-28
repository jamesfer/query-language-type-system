import { ResolvedNode } from '../type-checker/resolve-implicits';
import { UniqueIdGenerator } from '../utils/unique-id-generator';
import { DesugaredNode, DesugaredExpressionWithoutPatternMatch } from './desugar-pattern-match';
export declare type CoreExpression<T = void> = DesugaredExpressionWithoutPatternMatch<T>;
export declare type CoreNode = DesugaredNode;
export declare function desugar(makeUniqueId: UniqueIdGenerator, node: ResolvedNode): CoreNode;
export declare function stripCoreNode(node: CoreNode): CoreExpression;
//# sourceMappingURL=desugar.d.ts.map