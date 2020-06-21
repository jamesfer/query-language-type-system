import { TypedNode } from '..';
import { desugarDestructuring } from './desugar-destructuring';
import { desugarDualBindings, DesugaredNode } from './desugar-dual-bindings';

export function desugar(node: TypedNode): DesugaredNode {
  return desugarDualBindings(desugarDestructuring(node));
}
