import { fromPairs } from 'lodash';
import { makeExpressionIterator } from '../../desugar/iterators-specific';
import { ShapedNode, ShapedNodeDecoration } from '../compress-inferred-types/recursively-apply-inferred-types';
import { node } from '../constructors';
import { BindingExpression, Expression, FunctionExpression } from '../types/expression';
import { NodeWithChild } from '../types/node';
import { Value } from '../types/value';
import { extractDestructurableBindings } from './extract-destructurable-bindings';

export interface Scope {
  bindings: { [k: string]: Value };
}

export interface ScopedNodeDecoration {
  type: Value;
  shape: Value;
  scope: Scope;
}

export type ScopedNode<T = void> = NodeWithChild<ScopedNodeDecoration, T extends void ? ScopedNode : T>;

function buildBindingScope(scope: Scope, expression: BindingExpression<ShapedNode>, ): BindingExpression<ScopedNode> {
  const bodyScope = {
    ...scope,
    [expression.name]: expression.value.decoration.type,
  };

  return {
    ...expression,
    value: shallowBuildScope(scope)(expression.value),
    body: shallowBuildScope(bodyScope)(expression.body),
  };
}

function buildFunctionScope(scope: Scope, expression: FunctionExpression<ShapedNode>): FunctionExpression<ScopedNode> {
  const identifiers = extractDestructurableBindings(expression.parameter);
  const bodyScope = {
    ...scope,
    ...fromPairs(identifiers.filter(([name]) => !(name in scope))),
  };
  return {
    ...expression,
    parameter: shallowBuildScope(scope)(expression.parameter),
    body: shallowBuildScope(bodyScope)(expression.body),
  }
}

function attachScope(scope: Scope, decoration: ShapedNodeDecoration, expression: Expression<ScopedNode>): ScopedNode {
  return node(expression, { ...decoration, scope });
}

const shallowBuildScope = (scope: Scope) => (node: ShapedNode): ScopedNode => {
  switch (node.expression.kind) {
    case 'BindingExpression':
      return attachScope(scope, node.decoration, buildBindingScope(scope, node.expression));
    case 'FunctionExpression':
      return attachScope(scope, node.decoration, buildFunctionScope(scope, node.expression));
    default: {
      const scopedExpression = makeExpressionIterator(shallowBuildScope(scope))(node.expression);
      return attachScope(scope, node.decoration, scopedExpression);
    }
  }
}

export function buildScopedNode(node: ShapedNode): ScopedNode {
  return shallowBuildScope({ bindings: { } })(node);
}
