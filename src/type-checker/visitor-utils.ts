import { mapValues } from 'lodash';
import { TypedNode } from './type-check';
import { Expression } from './types/expression';
import { Value } from './types/value';
import { assertNever } from './utils';

export function* unfoldParameters(value: Value): Generator<[boolean, Value, Value]> {
  let currentValue = value;
  while (currentValue.kind === 'FunctionLiteral' || currentValue.kind === 'ImplicitFunctionLiteral') {
    const { parameter, body } = currentValue;
    yield [currentValue.kind === 'ImplicitFunctionLiteral', parameter, body];
    currentValue = body;
  }
}

export function* unfoldExplicitParameters(value: Value): Generator<[Value, Value, Value[]]> {
  const skippedImplicits: Value[] = [];
  for (const [implicit, parameter, body] of unfoldParameters(value)) {
    if (implicit) {
      skippedImplicits.push(parameter);
    } else {
      yield [parameter, body, skippedImplicits];
    }
  }
}

interface Visitor<T> {
  before?(t: T): T;
  after?(t: T): T;
}

export const visitExpressionNodes = (visitor: Visitor<TypedNode>) => (expression: Expression<TypedNode>): Expression<TypedNode> => {
  switch (expression.kind) {
    case 'SymbolExpression':
    case 'NumberExpression':
    case 'BooleanExpression':
    case 'Identifier':
      return expression;

    case 'RecordExpression':
      return {
        ...expression,
        properties: mapValues(expression.properties, visitNodes(visitor)),
      };

    case 'Application':
      return {
        ...expression,
        callee: visitNodes(visitor)(expression.callee),
        parameter: visitNodes(visitor)(expression.parameter),
      };

    case 'FunctionExpression':
      return {
        ...expression,
        body: visitNodes(visitor)(expression.body),
      };

    case 'DataInstantiation':
      return {
        ...expression,
        parameters: expression.parameters.map(visitNodes(visitor)),
      };

    case 'BindingExpression':
      return {
        ...expression,
        value: visitNodes(visitor)(expression.value),
        body: visitNodes(visitor)(expression.body),
      };

    case 'DualExpression':
      return {
        ...expression,
        left: visitNodes(visitor)(expression.left),
        right: visitNodes(visitor)(expression.right),
      };

    case 'ReadRecordPropertyExpression':
      return {
        ...expression,
        record: visitNodes(visitor)(expression.record),
      };

    case 'ReadDataPropertyExpression':
      return {
        ...expression,
        dataValue: visitNodes(visitor)(expression.dataValue),
      };

    default:
      return assertNever(expression);
  }
};
export const visitNodes = (visitor: Visitor<TypedNode>) => (node: TypedNode): TypedNode => {
  const beforeNode = visitor.before?.(node) || node;
  const transformedNode = {
    ...node,
    expression: visitExpressionNodes(visitor)(beforeNode.expression),
  };
  return visitor.after?.(transformedNode) || transformedNode;
};

export const visitChildValues = (visitor: Visitor<Value>) => (value: Value): Value => {
  switch (value.kind) {
    case 'SymbolLiteral':
    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'FreeVariable':
      return value;

    case 'DataValue':
      return {
        ...value,
        parameters: value.parameters.map(visitValue(visitor)),
      };

    case 'RecordLiteral':
      return {
        ...value,
        properties: mapValues(value.properties, visitValue(visitor)),
      };

    case 'DualBinding':
      return {
        ...value,
        left: visitValue(visitor)(value.left),
        right: visitValue(visitor)(value.right),
      };

    case 'FunctionLiteral':
    case 'ImplicitFunctionLiteral':
      return {
        ...value,
        parameter: visitValue(visitor)(value.parameter),
        body: visitValue(visitor)(value.body),
      };

    case 'ApplicationValue':
      return {
        ...value,
        parameter: visitValue(visitor)(value.parameter),
        callee: visitValue(visitor)(value.callee),
      };

    case 'ReadDataValueProperty':
      return {
        ...value,
        dataValue: visitValue(visitor)(value.dataValue),
      };

    case 'ReadRecordProperty':
      return {
        ...value,
        record: visitValue(visitor)(value.record),
      };

    default:
      return assertNever(value);
  }
};

export const visitValue = (visitor: Visitor<Value>) => (value: Value): Value => {
  const beforeValue = visitor.before?.(value) || value;
  const transformedValue = visitChildValues(visitor)(beforeValue);
  return visitor.after?.(transformedValue) || transformedValue;
};

const visitAndTransformChildValues = <T>(callback: (value: Value) => T extends void ? Value : T) => (value: Value): Value<T> => {
  switch (value.kind) {
    case 'SymbolLiteral':
    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'FreeVariable':
      return value;

    case 'DataValue':
      return {
        ...value,
        name: callback(value.name),
        parameters: value.parameters.map(callback),
      };

    case 'RecordLiteral':
      return {
        ...value,
        properties: mapValues(value.properties, callback),
      };

    case 'DualBinding':
      return {
        ...value,
        left: callback(value.left),
        right: callback(value.right),
      };

    case 'FunctionLiteral':
    case 'ImplicitFunctionLiteral':
      return {
        ...value,
        parameter: callback(value.parameter),
        body: callback(value.body),
      };

    case 'ApplicationValue':
      return {
        ...value,
        parameter: callback(value.parameter),
        callee: callback(value.callee),
      };

    case 'ReadDataValueProperty':
      return {
        ...value,
        dataValue: callback(value.dataValue),
      };

    case 'ReadRecordProperty':
      return {
        ...value,
        record: callback(value.record),
      };

    default:
      return assertNever(value);
  }
};

export const visitAndTransformValue = <T>(visitor: (value: Value<T>) => T extends void ? Value : T) => (value: Value): T extends void ? Value : T => {
  return visitor(visitAndTransformChildValues(visitAndTransformValue(visitor))(value))
};

export const visitValueForState = <S>(initial: S, visitor: Visitor<[S, Value]>) => (value: Value): S => {
  let state = initial;
  const wrap = (visitor: (s: [S, Value]) => [S, Value]) => (value: Value) => {
    const [newState, newValue] = visitor([state, value]);
    state = newState;
    return newValue;
  };
  visitValue({
    before: visitor.before ? wrap(visitor.before) : undefined,
    after: visitor.after ? wrap(visitor.after) : undefined,
  })(value);
  return state;
};

export const visitValueWithState = <S>(initial: S, visitor: Visitor<[S, Value]>) => (value: Value): Value => {
  let state = initial;
  const wrap = (visitor: (s: [S, Value]) => [S, Value]) => (value: Value) => {
    const [newState, newValue] = visitor([state, value]);
    state = newState;
    return newValue;
  };
  return visitValue({
    before: visitor.before ? wrap(visitor.before) : undefined,
    after: visitor.after ? wrap(visitor.after) : undefined,
  })(value);
};
