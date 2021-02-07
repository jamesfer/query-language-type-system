import { ResolvedNode } from '../type-checker/resolve-implicits/index';
import { desugarDestructuring } from './desugar-destructuring';
import { desugarDualBindings } from './desugar-dual-bindings';
import {
  desugarPatternMatch,
  DesugaredNode,
  DesugaredExpressionWithoutPatternMatch, stripDesugaredNodeWithoutPatternMatch,
} from './desugar-pattern-match';

export type CoreExpression<T = void> = DesugaredExpressionWithoutPatternMatch<T>;
export type CoreNode = DesugaredNode;

export function desugar(node: ResolvedNode): CoreNode {
  return desugarPatternMatch(desugarDualBindings(desugarDestructuring(node)));
}

export function stripCoreNode(node: CoreNode): CoreExpression {
  return stripDesugaredNodeWithoutPatternMatch(node);
}
