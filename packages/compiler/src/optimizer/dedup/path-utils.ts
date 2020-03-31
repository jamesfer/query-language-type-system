import { mapValues } from 'lodash';
import { Expression, Node, NodeWithChild } from '../..';
import { TypedDecoration } from '../../type-checker/type-check';
import { assertNever } from '../../type-checker/utils';
import { TypedNodeWithPath } from './dedup';

/**
 * Checks that the child starts with the same elements as the parent path. This would mean that the
 * node at the parent path contains the node at the child path.
 */
export function pathIsChild(parent: string[], child: string[]): boolean {
  return child.length >= parent.length
    && pathIsEqual(parent, child.slice(0, parent.length));
}

export function pathIsEqual(left: string[], right: string[]): boolean {
  return left.length === right.length
    && left.every((segment, index) => segment === right[index]);
}

export function prependSegment(segment: string): (path: string[]) => string[] {
  return path => [segment, ...path];
}

export function setPath(node: NodeWithChild<TypedDecoration, TypedNodeWithPath>, path: string[]): TypedNodeWithPath {
  return {
    ...node,
    decoration: {
      path,
      type: node.decoration,
    },
  };
}

export function prependPath(node: TypedNodeWithPath, pathPart: string): TypedNodeWithPath {
  return {
    ...node,
    decoration: {
      ...node.decoration,
      path: [pathPart, ...node.decoration.path],
    },
  };
}

function prependPaths(paths: string[]): (node: TypedNodeWithPath) => TypedNodeWithPath {
  return (node) => ({
    ...node,
    decoration: {
      ...node.decoration,
      path: [...paths, ...node.decoration.path],
    },
  });
}


export function constructPath<T>(parentPath: string[], expression: Expression<TypedNodeWithPath>): Expression<TypedNodeWithPath> {
  switch (expression.kind) {
    case 'Identifier':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
    case 'SymbolExpression':
      return expression;

    case 'RecordExpression':
      return {
        ...expression,
        properties: mapValues(mapValues(expression.properties, prependPath), prependPaths(parentPath)),
      };

    case 'Application':
      return {
        ...expression,
        callee: prependPaths(parentPath)(prependPath(expression.callee, 'callee')),
        parameter: prependPaths(parentPath)(prependPath(expression.parameter, 'parameter')),
      };

    case 'FunctionExpression':
      return {
        ...expression,
        // parameter: prependPath(expression.parameter, 'parameter'),
        body: prependPaths(parentPath)(prependPath(expression.body, 'body')),
      };

    case 'DataInstantiation':
      return {
        ...expression,
        callee: prependPaths(parentPath)(prependPath(expression.callee, 'callee')),
        parameters: expression.parameters.map((parameter, index) => prependPaths(parentPath)(prependPath(parameter, `${index}`))),
      };

    case 'BindingExpression':
      return {
        ...expression,
        value: prependPaths(parentPath)(prependPath(expression.value, 'value')),
        body: prependPaths(parentPath)(prependPath(expression.body, 'body')),
      };

    case 'DualExpression':
      return {
        ...expression,
        left: prependPaths(parentPath)(prependPath(expression.left, 'left')),
        right: prependPaths(parentPath)(prependPath(expression.right, 'right')),
      };

    case 'ReadRecordPropertyExpression':
      return {
        ...expression,
        record: prependPaths(parentPath)(prependPath(expression.record, 'record')),
      };

    case 'ReadDataPropertyExpression':
      return {
        ...expression,
        dataValue: prependPaths(parentPath)(prependPath(expression.dataValue, 'dataValue')),
      };

    case 'PatternMatchExpression':
      return {
        ...expression,
        // TODO patterns
        value: prependPaths(parentPath)(prependPath(expression.value, 'value')),
      };

    case 'NativeExpression':
      return expression;

    default:
      return assertNever(expression);
  }
}

export function mapNodeAt<T>(node: Node<T>, path: string[], f: (node: Node<T>) => Node<T>): Node<T> {
  if (path.length === 0) {
    return f(node);
  }

  const [segment, ...remainingPath] = path;
  const recurse = (node: Node<T>) => mapNodeAt(node, remainingPath, f);
  switch (node.expression.kind) {
    case 'Identifier':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
    case 'SymbolExpression':
    case 'NativeExpression':
      return node;

    case 'RecordExpression':
      return {
        ...node,
        expression: {
          ...node.expression,
          properties: {
            ...node.expression.properties,
            [segment]: recurse(node.expression.properties[segment]),
          },
        },
      };

    case 'Application':
    case 'FunctionExpression':
    case 'BindingExpression':
    case 'DualExpression':
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'PatternMatchExpression':
      return {
        ...node,
        expression: {
          ...node.expression,
          [segment]: recurse(node.expression[segment]),
        },
      };

    case 'DataInstantiation':
      return {
        ...node,
        expression: {
          ...node.expression,
          ...segment === 'callee'
            ? {
              callee: recurse(node.expression.callee),
            }
            : {
              parameters: [
                ...node.expression.parameters.slice(0, +segment),
                recurse(node.expression.parameters[segment]),
                ...node.expression.parameters.slice(+segment + 1),
              ],
            },
        },
      };
  }
}

export function getNodeAt<T>(node: Node<T>, path: string[]): Node<T> {
  return path.reduce(
    (node, segment) => {
      switch (node.expression.kind) {
        case 'Identifier':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'SymbolExpression':
        case 'NativeExpression':
          return node;

        case 'RecordExpression':
          return node.expression.properties[segment];

        case 'Application':
        case 'FunctionExpression':
        case 'BindingExpression':
        case 'DualExpression':
        case 'ReadRecordPropertyExpression':
        case 'ReadDataPropertyExpression':
        case 'PatternMatchExpression':
          return node.expression[segment];

        case 'DataInstantiation':
          return segment === 'callee'
            ? node.expression.callee
            : node.expression.parameters[segment];
      }
    },
    node,
  );
}


