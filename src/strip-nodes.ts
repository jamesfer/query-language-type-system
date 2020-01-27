import { mapValues } from 'lodash';
import { Expression } from './types/expression';
import { Node } from './types/node';
import { assertNever } from './utils';

export function stripNode<T>(node: Node<T>): Expression {
  return stripExpression(node.expression);
}

export function stripExpression<T extends Node<any>>(expression: Expression<T>): Expression {
  switch (expression.kind) {
    case 'Identifier':
    case 'SymbolExpression':
    case 'NumberExpression':
    case 'BooleanExpression':
      return expression;

    case 'RecordExpression':
      return {
        ...expression,
        properties: mapValues(expression.properties, stripNode)
      };

    case 'Application':
      return {
        ...expression,
        callee: stripNode(expression.callee),
        parameters: expression.parameters.map(stripNode),
      };

    case 'FunctionExpression':
      return {
        ...expression,
        body: stripNode(expression.body),
      };

    case 'DataInstantiation':
      return {
        ...expression,
        callee: stripNode(expression.callee),
        parameters: expression.parameters.map(stripNode),
      };

    case 'BindingExpression':
      return {
        ...expression,
        value: stripNode(expression.value),
        body: stripNode(expression.body),
      };

    case 'DualExpression':
      return {
        ...expression,
        left: stripNode(expression.left),
        right: stripNode(expression.right),
      };

    case 'ReadRecordPropertyExpression':
      return {
        ...expression,
        record: stripNode(expression.record),
      };

    case 'ReadDataPropertyExpression':
      return {
        ...expression,
        dataValue: stripNode(expression.dataValue),
      };

    // case 'ImplementExpression':
    //   return {
    //     ...expression,
    //     parameters: expression.parameters.map(stripNode),
    //     body: stripNode(expression.body),
    //   };

    // case 'DataDeclaration':
    //   return {
    //     ...expression,
    //     parameters: expression.parameters.map(stripNode),
    //     body: stripNode(expression.body),
    //   };

    default:
      return assertNever(expression);
  }
}
