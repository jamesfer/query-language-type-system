import { TypedNode, Expression, NodeWithChild } from '../..';
import { TypedDecoration } from '../../type-checker/type-check';
import {
  visitAndTransformChildExpression,
  visitAndTransformNode,
  visitNodes,
} from '../../type-checker/visitor-utils';

interface TypeAndBindingDecoration {
  type: TypedDecoration;
  bindings: string[];
}

function removedUnusedBindingsVisitor(node: NodeWithChild<TypedDecoration, [string[], TypedNode]>): [string[], TypedNode] {
  if (node.expression.kind === 'BindingExpression') {
    const [variables] = node.expression.body;
    if (!variables.includes(node.expression.name)) {
      return node.expression.body;
    }
  }

  let allVariables: string[] = [];
  const expression = visitAndTransformChildExpression<[string[], TypedNode], TypedNode>(
    ([variables, node]) => {
      allVariables = allVariables.concat(variables);
      return node;
    },
  )(node.expression);

  if (expression.kind === 'Identifier') {
    allVariables.push(expression.name);
  }

  return [allVariables, { ...node, expression }];
}

export function removeUnusedBindings(node: TypedNode): TypedNode {
  const [_, resultNode] = visitAndTransformNode<TypedDecoration, [string[], TypedNode]>(
    removedUnusedBindingsVisitor
  )(node);
  return resultNode;
}
