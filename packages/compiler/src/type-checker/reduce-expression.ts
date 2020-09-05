import { simplify } from './evaluate';
import { findBinding } from './scope-utils';
import { Expression } from './types/expression';
import { Scope } from './types/scope';
import { Value } from './types/value';
import { assertNever } from './utils';
import { visitAndTransformExpression } from './visitor-utils';
import { stripNode } from './strip-nodes';

const expressionToValue = (scope: Scope) => (expression: Expression<Value>): Value => {
  switch (expression.kind) {
    case 'Identifier':
      const binding = findBinding(scope, expression.name);
      if (binding) {
        if (binding.node) {
          return reduceExpression(scope, stripNode(binding.node));
        }
        return binding.type;
      }

      return {
        kind: 'FreeVariable',
        name: expression.name,
      };

    case 'BooleanExpression':
      return {
        kind: 'BooleanLiteral',
        value: expression.value,
      };

    case 'NumberExpression':
      return {
        kind: 'NumberLiteral',
        value: expression.value,
      };

    case 'StringExpression':
      return {
        kind: 'StringLiteral',
        value: expression.value,
      };

    case 'SymbolExpression':
      return {
        kind: 'SymbolLiteral',
        name: expression.name,
      };

    case 'RecordExpression':
      return {
        kind: 'RecordLiteral',
        properties: expression.properties,
      };

    case 'Application':
      return {
        kind: 'ApplicationValue',
        callee: expression.callee,
        parameter: expression.parameter,
      };

    case 'FunctionExpression':
      return {
        kind: expression.implicit ? 'ImplicitFunctionLiteral' : 'FunctionLiteral',
        parameter: expression.parameter,
        body: expression.body,
      };

    case 'DataInstantiation':
      return {
        kind: 'DataValue',
        name: expression.callee,
        parameters: expression.parameters,
      };

    case 'BindingExpression':
      // This is possibly wrong because the binding won't appear in the child state
      return expression.body;

    case 'DualExpression':
      return {
        kind: 'DualBinding',
        left: expression.left,
        right: expression.right,
      };

    case 'ReadRecordPropertyExpression':
      return {
        kind: 'ReadRecordProperty',
        property: expression.property,
        record: expression.record,
      };

    case 'ReadDataPropertyExpression':
      return {
        kind: 'ReadDataValueProperty',
        property: expression.property,
        dataValue: expression.dataValue,
      };

    case 'PatternMatchExpression':
      return {
        kind: 'PatternMatchValue',
        value: expression.value,
        patterns: expression.patterns,
      };

    case 'NativeExpression':
      throw new Error('NativeExpressions are not yet supported');

    default:
      return assertNever(expression);
  }
};

export function reduceExpression(scope: Scope, expression: Expression): Value {
  const newVar = visitAndTransformExpression(expressionToValue(scope))(expression);
  return simplify(newVar);
}
