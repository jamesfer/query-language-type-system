import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { Expression } from '../types/expression';
import { flow } from 'fp-ts/function';
import { makeExpressionIterator } from '../../desugar/iterators-specific';
import { NodeWithChild } from '../types/node';
import { node } from '../constructors';

export interface NamedNodeDecoration {
  shapeName: string;
}

export type NamedNode<T = void> =
  NodeWithChild<NamedNodeDecoration, T extends void ? NamedNode : T>;

interface ExpressionWith<T> {
  expression: Expression;
  value: T;
}

const selectChildNamedNodes = makeExpressionIterator<ExpressionWith<NamedNode>, NamedNode>(
  ({ value }) => value,
);

const selectChildExpressions = makeExpressionIterator<ExpressionWith<any>, Expression>(
  ({ expression }) => expression,
);

function getPrefix(expression: Expression<any>): string {
  if (expression.kind === 'Identifier') {
    return `nodeIdentifier${expression.name}Type$`;
  }

  return `node${expression.kind}Type$`;
}

/**
 * Converts an expression to a named node. It attaches the result type of the expression and a
 * generated shape name to the node.
 */
const makeNamedNode = (
  makeUniqueId: UniqueIdGenerator,
) => (
  expression: Expression<ExpressionWith<NamedNode>>,
): ExpressionWith<NamedNode> => {
  return {
    expression: selectChildExpressions(expression),
    value: node(selectChildNamedNodes(expression), {
      shapeName: makeUniqueId(getPrefix(expression)),
    }),
  };
};

function attachShapesWithState(
  makeUniqueId: UniqueIdGenerator,
): (expression: Expression) => NamedNode {
  const iterateOverChildren: (
    expression: Expression,
  ) => Expression<ExpressionWith<NamedNode>> = flow(
    // Recurse through all children
    makeExpressionIterator((e: Expression) => iterateOverChildren(e)),
    // Determine the type of the expression and attach a name
    makeExpressionIterator(makeNamedNode(makeUniqueId)),
  );
  return flow(
    iterateOverChildren,
    makeNamedNode(makeUniqueId),
    expression => expression.value,
  );
}

export function nameNodes(
  makeUniqueId: UniqueIdGenerator,
  expression: Expression,
): NamedNode {
  return attachShapesWithState(makeUniqueId)(expression);
}
