import { fold, fromPredicate } from 'fp-ts/Either';
import { flow, identity } from 'fp-ts/function';
import { mapValues } from 'lodash';
import { tap } from 'lodash/fp'
import { makeExpressionIterator } from '../../desugar/iterators-specific';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import {
  booleanLiteral,
  dataValue,
  freeVariable,
  functionType,
  node,
  numberLiteral,
  recordLiteral,
  stringLiteral,
  symbol,
} from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { BindingExpression, Expression } from '../types/expression';
import { NodeWithChild } from '../types/node';
import { FreeVariable, Value } from '../types/value';
import { evaluatedPair, exactPair, ValuePair } from '../types/value-pair';

export interface NamedNodeDecoration {
  shapeName: string;
  type: Value;
}

export type NamedNode<T = void> = NodeWithChild<NamedNodeDecoration, T extends void ? NamedNode : T>;

interface ExpressionWith<T> {
  expression: Expression;
  value: T;
}

const convertChildrenToShapeNames = makeExpressionIterator<ExpressionWith<NamedNode>, ExpressionWith<FreeVariable>>(
  ({ expression, value }) => ({ expression, value: freeVariable(value.decoration.shapeName) })
);

const selectChildNamedNodes = makeExpressionIterator<ExpressionWith<NamedNode>, NamedNode>(
  ({ value }) => value,
);

const selectChildExpressions = makeExpressionIterator<ExpressionWith<any>, Expression>(
  ({ expression }) => expression,
);

/**
 * Returns the type of a particular expression. In addition, it records any value pairs between the
 * child types and the result type.
 */
function determineResultType(
  pairsState: StateRecorder<ValuePair>,
  makeUniqueId: UniqueIdGenerator,
  expressionWithNodes: Expression<ExpressionWith<NamedNode>>,
): Value {
  const expression = selectChildExpressions(expressionWithNodes);
  const shallowExpression = convertChildrenToShapeNames(expressionWithNodes);
  switch (shallowExpression.kind) {
    case 'Identifier':
      return freeVariable(shallowExpression.name);

    case 'BooleanExpression':
      return booleanLiteral(shallowExpression.value);

    case 'NumberExpression':
      return numberLiteral(shallowExpression.value);

    case 'StringExpression':
      return stringLiteral(shallowExpression.value);

    case 'SymbolExpression':
      return symbol(shallowExpression.name);

    case 'RecordExpression': {
      const propertyTypes = mapValues(shallowExpression.properties, property => property.value);
      return recordLiteral(propertyTypes);
    }

    case 'Application': {
      const resultType = freeVariable(makeUniqueId('applicationResult$'));
      const parameter = freeVariable(makeUniqueId('applicationParameter$'));
      pairsState.push(evaluatedPair(
        { expression, value: functionType(resultType, [parameter]) },
        shallowExpression.callee,
      ));
      pairsState.push(evaluatedPair(
        { expression, value: parameter },
        shallowExpression.parameter,
      ));
      return resultType;
    }

    case 'FunctionExpression':
      return functionType(shallowExpression.body.value, [
        [shallowExpression.parameter.value, shallowExpression.implicit],
      ]);

    case 'DataInstantiation': {
      const parameterTypes = shallowExpression.parameters.map(parameter => parameter.value)
      return dataValue(shallowExpression.callee.value, parameterTypes);
    }

    case 'BindingExpression':
      pairsState.push(exactPair(
        { expression, value: freeVariable(shallowExpression.name) },
        shallowExpression.value,
      ));
      return shallowExpression.body.value;

    case 'DualExpression': {
      const resultType = freeVariable(makeUniqueId('dualExpression$'));
      pairsState.push(evaluatedPair(
        { expression, value: resultType },
        shallowExpression.right,
      ));
      pairsState.push(evaluatedPair(
        { expression, value: resultType },
        shallowExpression.right,
      ));
      return resultType;
    }

    case 'ReadRecordPropertyExpression': {
      const resultType = freeVariable(makeUniqueId('readRecordProperty$'));
      // TODO this implementation is bugged because it requires that record have exactly these properties
      const expectedType = recordLiteral({ [shallowExpression.property]: resultType });
      pairsState.push(evaluatedPair(
        { expression, value: expectedType },
        shallowExpression.record,
      ));
      return resultType;
    }

    case 'ReadDataPropertyExpression': {
      const resultType = freeVariable(makeUniqueId('readDataProperty$'));
      // TODO this implementation is bugged because it requires that data value have exactly this many elements
      const expectedType = dataValue(
        freeVariable(makeUniqueId('dataPropertyName$')),
        [
          ...Array(shallowExpression.property).fill(0).map(() => freeVariable(makeUniqueId(
            'dataPropertyParameter$'))),
          resultType,
        ],
      );
      pairsState.push(evaluatedPair(
        { expression, value: expectedType },
        shallowExpression.dataValue,
      ));
      return resultType;
    }

    case 'PatternMatchExpression': {
      const resultType = freeVariable(makeUniqueId('patternMatchBody$'));
      const testType = freeVariable(makeUniqueId('patternMatchTest$'));
      shallowExpression.patterns.forEach((pattern) => {
        pairsState.push(evaluatedPair(
          { expression, value: testType },
          pattern.test,
        ));
        pairsState.push(evaluatedPair(
          { expression, value: resultType },
          pattern.value,
        ));
      });
      pairsState.push(evaluatedPair(
        { expression, value: testType },
        shallowExpression.value,
      ));
      return resultType;
    }

    case 'NativeExpression':
      return freeVariable(makeUniqueId('nativeExpression$'));
  }
}

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
  pairsState: StateRecorder<ValuePair>,
  makeUniqueId: UniqueIdGenerator,
) => (
  expression: Expression<ExpressionWith<NamedNode>>,
): ExpressionWith<NamedNode> => {
  return {
    expression: selectChildExpressions(expression),
    value: node(selectChildNamedNodes(expression), {
      type: determineResultType(pairsState, makeUniqueId, expression),
      shapeName: makeUniqueId(getPrefix(expression))
    }),
  };
}

/**
 * Records a value pair between the expression's shape name and the result type.
 */
const recordShapePair = (
  pairsState: StateRecorder<ValuePair>,
  kind: ValuePair['kind'],
) => (
  { expression, value }: ExpressionWith<NamedNode>
): void => {
  const makePair = kind === 'Evaluated' ? evaluatedPair : exactPair;
  pairsState.push(makePair(
    { expression, value: value.decoration.type },
    { expression, value: freeVariable(value.decoration.shapeName) },
  ));
}

/**
 * Records the value pairs for a binding expression.
 */
const recordBindingExpressionPairs = (pairsState: StateRecorder<ValuePair>) => (
  expression: BindingExpression<ExpressionWith<NamedNode>>,
): void => {
  recordShapePair(pairsState, 'Exact')(expression.value);
  recordShapePair(pairsState, 'Evaluated')(expression.body);
};

const isBindingExpression = (
  expression: Expression<ExpressionWith<NamedNode>>
): expression is BindingExpression<ExpressionWith<NamedNode>> => (
  expression.kind === 'BindingExpression'
);

const recordChildShapePairs = (
  pairsState: StateRecorder<ValuePair>,
): (expression: Expression<ExpressionWith<NamedNode>>) => void => {
  return flow(
    fromPredicate(isBindingExpression, identity),
    fold(
      makeExpressionIterator(recordShapePair(pairsState, 'Evaluated')),
      recordBindingExpressionPairs(pairsState),
    ),
  );
}

function attachShapesWithState(
  pairsState: StateRecorder<ValuePair>,
  makeUniqueId: UniqueIdGenerator,
): (expression: Expression) => NamedNode {
  const iterateOverChildren: (expression: Expression) => Expression<ExpressionWith<NamedNode>> = flow(
    // Recurse through all children
    makeExpressionIterator((e: Expression) => iterateOverChildren(e)),
    // Determine the type of the expression and attach a name
    makeExpressionIterator(makeNamedNode(pairsState, makeUniqueId)),
    // Record any value pairs on the named node
    tap(recordChildShapePairs(pairsState)),
  );
  return flow(
    iterateOverChildren,
    makeNamedNode(pairsState, makeUniqueId),
    tap(recordShapePair(pairsState, 'Evaluated')),
    expression => expression.value,
  );
}

export function attachShapes(
  makeUniqueId: UniqueIdGenerator,
  expression: Expression,
): [ValuePair[], NamedNode] {
  const pairsState = new StateRecorder<ValuePair>();
  const namedNode = attachShapesWithState(pairsState, makeUniqueId)(expression);
  return [pairsState.values, namedNode];
}
