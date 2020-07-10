import { TypedNode } from '..';
import { desugarDestructuring } from './desugar-destructuring';
import { desugarDualBindings, DesugaredNode } from './desugar-dual-bindings';
import { desugarPatternMatch } from './desugar-pattern-match';

export function desugar(node: TypedNode): DesugaredNode {
  return desugarPatternMatch(desugarDualBindings(desugarDestructuring(node)));
}
