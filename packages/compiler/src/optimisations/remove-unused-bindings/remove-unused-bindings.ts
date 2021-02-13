import { flatten } from 'lodash';
import { NodeWithExpression } from '../..';
import {
  DesugaredExpressionWithoutPatternMatch,
  DesugaredNode,
  makePatternMatchDesugaredNodeIterator,
} from '../../desugar/desugar-pattern-match';
import { ResolvedNodeDecoration } from '../../type-checker/resolve-implicits';
import { mapNode } from '../../type-checker/visitor-utils';

function collectChildBindings<T>(node: DesugaredExpressionWithoutPatternMatch<[string[], T]>): [string[], DesugaredExpressionWithoutPatternMatch<T>] {
  const allVariables: string[][] = [];
  const collector = ([variables, expression]: [string[], T]): T => {
    allVariables.push(variables);
    return expression;
  };
  const expression = makePatternMatchDesugaredNodeIterator(collector)(node);
  return [flatten(allVariables), expression];
}

function removedUnusedBindingsVisitor(node: NodeWithExpression<ResolvedNodeDecoration, DesugaredExpressionWithoutPatternMatch<[string[], DesugaredNode]>>): [string[], DesugaredNode] {
  const expression = node.expression;
  if (expression.kind === 'BindingExpression') {
    // Check if the binding is used inside the body
    const [variables] = expression.body;
    if (!variables.includes(expression.name)) {
      return expression.body;
    }
  } else if (expression.kind === 'Identifier') {
    return [[expression.name], { ...node, expression }];
  }

  const [variables, plainExpression] = collectChildBindings(expression);
  return [variables, { ...node, expression: plainExpression }];
}

export function removeUnusedBindings(node: DesugaredNode): DesugaredNode {
  const internal = (node: DesugaredNode): [string[], DesugaredNode] => (
    removedUnusedBindingsVisitor(mapNode(iterator, node))
  );
  const iterator = makePatternMatchDesugaredNodeIterator(internal);
  const [, result] = internal(node);
  return result;
}
