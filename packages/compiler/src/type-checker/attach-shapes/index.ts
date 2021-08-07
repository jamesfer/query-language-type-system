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
import { Expression } from '../types/expression';
import { Message } from '../types/message';
import { NodeWithChild } from '../types/node';
import { FreeVariable, Value } from '../types/value';

export interface NamedNodeDecoration {
  shapeName: string;
  type: Value;
}

export type NamedNode<T = void> = NodeWithChild<NamedNodeDecoration, T extends void ? NamedNode : T>;

function produceValueInferences(
  makeUniqueId: UniqueIdGenerator,
  expression: Expression<FreeVariable>,
): [[Value, Value][], Value] {
  switch (expression.kind) {
    case 'Identifier':
      return [[], freeVariable(expression.name)];
    case 'BooleanExpression':
      return [[], booleanLiteral(expression.value)];
    case 'NumberExpression':
      return [[], numberLiteral(expression.value)];
    case 'StringExpression':
      return [[], stringLiteral(expression.value)];
    case 'SymbolExpression':
      return [[], symbol(expression.name)];
    case 'RecordExpression':
      return [[], recordLiteral(expression.properties)];
    case 'Application': {
      const resultType = freeVariable(makeUniqueId('applicationResult$'));
      const parameter = freeVariable(makeUniqueId('applicationParameter$'));
      return [
        [
          [expression.callee, functionType(resultType, [parameter])],
          [expression.parameter, parameter],
        ],
        resultType,
      ];
    }
    case 'FunctionExpression':
      return [[], functionType(expression.body, [[expression.parameter, expression.implicit]])];
    case 'DataInstantiation':
      return [[], dataValue(expression.callee, expression.parameters)];
    case 'BindingExpression':
      return [
        [[freeVariable(expression.name), expression.value]],
        expression.body,
      ];
    case 'DualExpression': {
      const resultType = freeVariable(makeUniqueId('dualExpression$'));
      return [
        [
          [resultType, expression.right],
          [resultType, expression.left],
        ],
        resultType,
      ];
    }
    case 'ReadRecordPropertyExpression': {
      const resultType = freeVariable(makeUniqueId('readRecordProperty$'));
      // TODO this implementation is bugged because it requires that then record have exactly these properties
      const expectedType = recordLiteral({
        [expression.property]: resultType,
      });
      return [
        [[expression.record, expectedType]],
        resultType,
      ];
    }
    case 'ReadDataPropertyExpression': {
      const resultType = freeVariable(makeUniqueId('readDataProperty$'));
      // TODO this implementation is bugged because it requires that then data value have exactly this many elements
      const expectedType = dataValue(
        freeVariable(makeUniqueId('dataPropertyName$')),
        [
          ...Array(expression.property).fill(0).map(() => freeVariable(makeUniqueId(
            'dataPropertyParameter$'))),
          resultType,
        ],
      );
      return [
        [[expression.dataValue, expectedType]],
        resultType,
      ];
    }
    case 'PatternMatchExpression': {
      const resultType = freeVariable(makeUniqueId('patternMatchBody$'));
      const testType = freeVariable(makeUniqueId('patternMatchTest$'));
      return [
        [
          [testType, expression.value],
          ...expression.patterns.map<[Value, Value]>(pattern => [testType, pattern.test]),
          ...expression.patterns.map<[Value, Value]>(pattern => [resultType, pattern.value]),
        ],
        resultType,
      ];
    }
    case 'NativeExpression':
      return [[], freeVariable(makeUniqueId('nativeExpression$'))];
  }
}

const convertChildrenToShapeNames = makeExpressionIterator<NamedNode, FreeVariable>(node => (
  freeVariable(node.decoration.shapeName)
));

function getPrefix(expression: Expression<any>): string {
  if (expression.kind === 'Identifier') {
    return `nodeIdentifier${expression.name}Type$`;
  }

  return `node${expression.kind}Type$`;
}

const shallowAttachShapes = (
  inferredTypesState: StateRecorder<[Value, Expression, Value, Expression]>,
  messagesState: StateRecorder<Message>,
  makeUniqueId: UniqueIdGenerator,
) => (
  originalExpression: Expression,
  expression: Expression<NamedNode>
): NamedNode => {
  const shapeName = makeUniqueId(getPrefix(expression));
  const [inferences, type] = produceValueInferences(makeUniqueId, convertChildrenToShapeNames(expression));

  inferredTypesState.push([freeVariable(shapeName), originalExpression, type, originalExpression]);
  inferredTypesState.pushAll(inferences.map(([left, right]) => [left, originalExpression, right, originalExpression]));

  // TODO fix expressions in converge types
  // const [convergeMessages, inferredTypes] = unzip(inferences.map(([left, right]) => convergeValues(left, expression as any, right, expression as any)));
  // // Infer the return type of the expression first
  // inferredTypesState.push({ from: shapeName, to: type } as any); // TODO fix types
  // // Then add inferred types from child expressions
  // inferredTypesState.pushAll(flatten(inferredTypes));
  // messagesState.pushAll(flatten(convergeMessages));

  return node(expression, { type, shapeName });
}

export function attachShapes(
  makeUniqueId: UniqueIdGenerator,
  expression: Expression,
): [Message[], [Value, Expression, Value, Expression][], NamedNode] {
  const inferencesState = new StateRecorder<[Value, Expression, Value, Expression]>();
  const messagesState = new StateRecorder<Message>();
  const attachShapesWithState = shallowAttachShapes(inferencesState, messagesState, makeUniqueId);
  const internal = (expression: Expression): NamedNode => attachShapesWithState(expression, iterator(expression));
  const iterator = makeExpressionIterator(internal);
  return [messagesState.values, inferencesState.values, internal(expression)];
}

