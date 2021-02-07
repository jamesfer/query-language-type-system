import { flatten } from 'lodash';
import { makeExpressionIterator } from '../../desugar/iterators-specific';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import {
  application,
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
import { convergeValues } from '../converge-values';
import { InferredType } from '../converge-values/converge-types';
import { StateRecorder } from '../state-recorder/state-recorder';
import { newFreeVariable } from '../type-utils';
import { Expression } from '../types/expression';
import { Message } from '../types/message';
import { NodeWithChild } from '../types/node';
import { FreeVariable, Value } from '../types/value';
import { unzip } from '../utils';

export interface NamedNodeDecoration {
  shapeName: string;
  type: Value;
}

export type NamedNode<T = void> = NodeWithChild<NamedNodeDecoration, T extends void ? NamedNode : T>;

function getShape(node: NamedNode): FreeVariable {
  return freeVariable(node.decoration.shapeName);
}

const childrenToShapeNames = makeExpressionIterator(getShape);

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
      const resultType = newFreeVariable('applicationResult$', makeUniqueId);
      return [
        [[resultType, application(expression.callee, expression.parameter)]],
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
      const resultType = newFreeVariable('dualExpression$', makeUniqueId);
      return [
        [
          [resultType, expression.right],
          [resultType, expression.left],
        ],
        resultType,
      ];
    }
    case 'ReadRecordPropertyExpression': {
      const resultType = newFreeVariable('readRecordProperty$', makeUniqueId);
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
      const resultType = newFreeVariable('readDataProperty$', makeUniqueId);
      // TODO this implementation is bugged because it requires that then data value have exactly this many elements
      const expectedType = dataValue(
        newFreeVariable('dataPropertyName$', makeUniqueId),
        [
          ...Array(expression.property).fill(0).map(() => newFreeVariable('dataPropertyParameter$', makeUniqueId)),
          resultType,
        ],
      );
      return [
        [[expression.dataValue, expectedType]],
        resultType,
      ];
    }
    case 'PatternMatchExpression': {
      const resultType = newFreeVariable('patternMatchBody$', makeUniqueId);
      const testType = newFreeVariable('patternMatchTest$', makeUniqueId);
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
      return [[], newFreeVariable('nativeExpression$', makeUniqueId)];
  }
}

const shallowAttachShapes = (inferredTypesState: StateRecorder<InferredType>, messagesState: StateRecorder<Message>, makeUniqueId: UniqueIdGenerator) => (
  expression: Expression<NamedNode>
): NamedNode => {
  const shapeName = makeUniqueId('nodeType$');
  const [inferences, type] = produceValueInferences(makeUniqueId, childrenToShapeNames(expression));
  // TODO fix expressions in converge types
  const [convergeMessages, inferredTypes] = unzip(inferences.map(([left, right]) => convergeValues(left, expression as any, right, expression as any)));

  // Infer the return type of the expression first
  inferredTypesState.push({ from: shapeName, to: type } as any); // TODO fix types
  // Then add inferred types from child expressions
  inferredTypesState.pushAll(flatten(inferredTypes));
  messagesState.pushAll(flatten(convergeMessages));

  return node(expression, { type, shapeName });
}

export const attachShapes = (makeUniqueId: UniqueIdGenerator) => (expression: Expression): [Message[], InferredType[], NamedNode] => {
  const inferredTypesState = new StateRecorder<InferredType>();
  const messagesState = new StateRecorder<Message>();
  const attachShapesWithState = shallowAttachShapes(inferredTypesState, messagesState, makeUniqueId);
  const internal = (expression: Expression): NamedNode => attachShapesWithState(iterator(expression));
  const iterator = makeExpressionIterator(internal);
  return [messagesState.values, inferredTypesState.values, internal(expression)];
}

