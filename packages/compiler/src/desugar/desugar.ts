import { TypedNode } from '..';
import { desugarDestructuring } from './desugar-destructuring';
import { desugarDualBindings } from './desugar-dual-bindings';
import { desugarPatternMatch, DesugaredNode } from './desugar-pattern-match';

export function desugar(node: TypedNode): DesugaredNode {
  return desugarPatternMatch(desugarDualBindings(desugarDestructuring(node)));
}
