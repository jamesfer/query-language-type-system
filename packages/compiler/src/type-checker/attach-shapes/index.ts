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
import { BindingExpression, Expression, FunctionExpression } from '../types/expression';
import { InferredType, InferredTypeOperator, makeInferredType } from '../types/inferred-type';
import { NodeWithChild } from '../types/node';
import { FreeVariable, Value } from '../types/value';

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
 * Returns the type of the particular expression. In addition, it records any value pairs between the
 * child types and the result type.
 */
function determineResultType(
  inferredTypes: StateRecorder<InferredType>,
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
      inferredTypes.push(makeInferredType(
        'EvaluatesTo',
        shallowExpression.callee.value.name,
        functionType(resultType, [shallowExpression.parameter.value]),
        shallowExpression.callee.expression,
        expression,
      ));
      return resultType;

      // inferredTypes.push(makeInferredType(
      //   'EvaluatedFrom',
      //   pivot.name,
      //   shallowExpression.callee.value,
      //   expression,
      //   shallowExpression.callee.expression,
      // ));
      // inferredTypes.push(makeInferredType(
      //   'Equals',
      //   pivot.name,
      //   functionType(resultType, [shallowExpression.parameter.value]),
      //   expression,
      //   shallowExpression.parameter.expression,
      // ));

      // const parameter = freeVariable(makeUniqueId('applicationParameter$'));
      // inferredTypes.push(makeInferredType(
      //   'EvaluatedFrom',
      //   shallowExpression.callee.value.name,
      //   functionType(resultType, [parameter]),
      //   shallowExpression.callee.expression,
      //   expression,
      // ));
      // inferredTypes.push(makeInferredType(
      //   'EvaluatedFrom',
      //   shallowExpression.parameter.value.name,
      //   parameter,
      //   shallowExpression.parameter.expression,
      //   expression,
      // ));
      // return resultType;
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
      inferredTypes.push(makeInferredType(
        'Equals',
        shallowExpression.value.value.name,
        freeVariable(shallowExpression.name),
        shallowExpression.value.expression,
        expression,
      ));
      return shallowExpression.body.value;

    case 'DualExpression': {
      const resultType = freeVariable(makeUniqueId('dualExpression$'));
      inferredTypes.push(makeInferredType(
        'EvaluatedFrom',
        shallowExpression.left.value.name,
        resultType,
        shallowExpression.left.expression,
        expression,
      ));
      inferredTypes.push(makeInferredType(
        'EvaluatedFrom',
        shallowExpression.right.value.name,
        resultType,
        shallowExpression.right.expression,
        expression,
      ));
      return resultType;
    }

    case 'ReadRecordPropertyExpression': {
      const resultType = freeVariable(makeUniqueId('readRecordProperty$'));
      // TODO this implementation is bugged because it requires that record have exactly these properties
      const expectedType = recordLiteral({ [shallowExpression.property]: resultType });
      inferredTypes.push(makeInferredType(
        'EvaluatedFrom',
        shallowExpression.record.value.name,
        expectedType,
        shallowExpression.record.expression,
        expression,
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
      inferredTypes.push(makeInferredType(
        'EvaluatedFrom',
        shallowExpression.dataValue.value.name,
        expectedType,
        shallowExpression.dataValue.expression,
        expression,
      ));
      return resultType;
    }

    case 'PatternMatchExpression': {
      const resultType = freeVariable(makeUniqueId('patternMatchBody$'));
      const testType = freeVariable(makeUniqueId('patternMatchTest$'));
      inferredTypes.push(makeInferredType(
        'EvaluatedFrom',
        shallowExpression.value.value.name,
        testType,
        shallowExpression.value.expression,
        expression,
      ));
      shallowExpression.patterns.forEach((pattern) => {
        inferredTypes.push(makeInferredType(
          'EvaluatedFrom',
          pattern.test.value.name,
          testType,
          pattern.test.expression,
          expression,
        ));
        inferredTypes.push(makeInferredType(
          'EvaluatedFrom',
          pattern.value.value.name,
          resultType,
          pattern.value.expression,
          expression,
        ));
      });
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
  inferredTypes: StateRecorder<InferredType>,
  makeUniqueId: UniqueIdGenerator,
) => (
  expression: Expression<ExpressionWith<NamedNode>>,
): ExpressionWith<NamedNode> => {
  return {
    expression: selectChildExpressions(expression),
    value: node(selectChildNamedNodes(expression), {
      type: determineResultType(inferredTypes, makeUniqueId, expression),
      shapeName: makeUniqueId(getPrefix(expression))
    }),
  };
}

/**
 * Records a value pair between the expression's shape name and the result type.
 */
const recordShapePair = (
  inferredTypes: StateRecorder<InferredType>,
  kind: InferredTypeOperator,
) => (
  { expression, value }: ExpressionWith<NamedNode>
): void => {
  inferredTypes.push(makeInferredType(
    kind,
    value.decoration.shapeName,
    value.decoration.type,
    expression,
    expression,
  ));
}

/**
 * Records the value pairs for a binding expression.
 */
const recordBindingExpressionPairs = (inferredTypes: StateRecorder<InferredType>) => (
  expression: BindingExpression<ExpressionWith<NamedNode>>,
): void => {
  recordShapePair(inferredTypes, 'Equals')(expression.value);
  recordShapePair(inferredTypes, 'EvaluatedFrom')(expression.body);
};

/**
 * Records the value pairs for a function expression.
 */
const recordFunctionExpressionPairs = (inferredTypes: StateRecorder<InferredType>) => (
  expression: FunctionExpression<ExpressionWith<NamedNode>>,
): void => {
  recordShapePair(inferredTypes, 'EvaluatedFrom')(expression.parameter);
  recordShapePair(inferredTypes, 'Equals')(expression.body);
};

const isBindingExpression = (
  expression: Expression<ExpressionWith<NamedNode>>
): expression is BindingExpression<ExpressionWith<NamedNode>> => (
  expression.kind === 'BindingExpression'
);

const recordChildShapePairs = (
  inferredTypes: StateRecorder<InferredType>,
): (expression: Expression<ExpressionWith<NamedNode>>) => void => {
  return (expression) => {
    if (isBindingExpression(expression)) {
      recordBindingExpressionPairs(inferredTypes)(expression);
    } else if (expression.kind === 'FunctionExpression') {
      recordFunctionExpressionPairs(inferredTypes)(expression);
    } else {
      makeExpressionIterator(recordShapePair(inferredTypes, 'EvaluatedFrom'))(expression);
    }
  };

  // return flow(
  //   fromPredicate(isBindingExpression, identity),
  //   fold(
  //     makeExpressionIterator(recordShapePair(inferredTypes, 'EvaluatedFrom')),
  //     recordBindingExpressionPairs(inferredTypes),
  //   ),
  // );
}

function attachShapesWithState(
  inferredTypes: StateRecorder<InferredType>,
  makeUniqueId: UniqueIdGenerator,
): (expression: Expression) => NamedNode {
  const iterateOverChildren: (expression: Expression) => Expression<ExpressionWith<NamedNode>> = flow(
    // Recurse through all children
    makeExpressionIterator((e: Expression) => iterateOverChildren(e)),
    // Determine the type of the expression and attach a name
    makeExpressionIterator(makeNamedNode(inferredTypes, makeUniqueId)),
    // Record any value pairs on the named node
    tap(recordChildShapePairs(inferredTypes)),
  );
  return flow(
    iterateOverChildren,
    makeNamedNode(inferredTypes, makeUniqueId),
    tap(recordShapePair(inferredTypes, 'EvaluatedFrom')),
    expression => expression.value,
  );
}

export function attachShapes(
  makeUniqueId: UniqueIdGenerator,
  expression: Expression,
): [InferredType[], NamedNode] {
  const inferredTypes = new StateRecorder<InferredType>();
  const namedNode = attachShapesWithState(inferredTypes, makeUniqueId)(expression);
  return [inferredTypes.values, namedNode];
}
