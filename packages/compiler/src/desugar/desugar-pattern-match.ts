import * as types from '@babel/types';
import { flatMap } from 'lodash';
import {
  Application,
  BindingExpression,
  BooleanExpression, DataInstantiation, Expression,
  Identifier, NativeExpression,
  NodeWithExpression,
  NumberExpression, ReadDataPropertyExpression, ReadRecordPropertyExpression, RecordExpression,
  StringExpression, SymbolExpression,
} from '..';
import { scope } from '../type-checker/constructors';
import { findBinding } from '../type-checker/scope-utils';
import { TypedDecoration } from '../type-checker/type-check';
import { Value } from '../type-checker/types/value';
import { assertNever } from '../type-checker/utils';
import { mapNode } from '../type-checker/visitor-utils';
import {
  SimpleFunctionExpression, simpleFunctionMapIterator,
} from './desugar-destructuring';
import {
  DesugaredNode as DualBindingDesugaredNode,
  makeDualBindingDesugaredNodeIterator,
} from './desugar-dual-bindings';
import { DesugaredExpressionWithoutDualExpression } from './desugar-dual-bindings';
import { combineIteratorMap } from './iterators-core';
import {
  applicationMapIterator,
  bindingMapIterator,
  dataInstantiationMapIterator,
  emptyMapIterator,
  makeStripNode,
  patternMatchMapIterator,
  readDataPropertyMapIterator,
  readRecordPropertyMapIterator, recordMapIterator,
  shallowStripNode,
} from './iterators-specific';

export type DesugaredExpressionWithoutPatternMatch<T = void> =
  | Identifier
  | BooleanExpression
  | NumberExpression
  | StringExpression
  | SymbolExpression
  // This is because we want the default behaviour of an expression to contain an expression, but we
  // can't just add DesugaredExpressionWithoutDualExpression as the default to T because it is recursive.
  | RecordExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T>
  | Application<T extends void ? DesugaredExpressionWithoutPatternMatch : T>
  | SimpleFunctionExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T>
  | DataInstantiation<T extends void ? DesugaredExpressionWithoutPatternMatch : T>
  | BindingExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T>
  | ReadRecordPropertyExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T>
  | ReadDataPropertyExpression<T extends void ? DesugaredExpressionWithoutPatternMatch : T>
  | NativeExpression;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly ['DesugaredExpressionWithoutPatternMatch']: DesugaredExpressionWithoutPatternMatch<A>;
  }
}

export interface DesugaredNode extends NodeWithExpression<TypedDecoration, DesugaredExpressionWithoutPatternMatch<DesugaredNode>> {}

interface PartiallyDesugaredNode extends NodeWithExpression<TypedDecoration, DesugaredExpressionWithoutDualExpression<DesugaredNode>> {}

function convertPatternMatchToConditions(value: DesugaredNode, test: DesugaredNode): DesugaredNode[] {
  switch (test.expression.kind) {
    case 'SymbolExpression':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression': {
      // TODO types are really hacky here
      return [{
        kind: 'Node',
        expression: {
          kind: 'Application',
          parameter: test,
          callee: {
            kind: 'Node',
            expression: {
              kind: 'Application',
              parameter: value,
              callee: {
                kind: 'Node',
                expression: {
                  kind: 'Identifier',
                  name: 'equals',
                },
                decoration: {
                  scope: scope(),
                  type: {
                    kind: 'FreeVariable',
                    name: 'a',
                  },
                  implicitType: {
                    kind: 'FreeVariable',
                    name: 'a',
                  },
                },
              },
            },
            decoration: {
              scope: scope(),
              type: {
                kind: 'FreeVariable',
                name: 'b',
              },
              implicitType: {
                kind: 'FreeVariable',
                name: 'b',
              },
            },
          },
        },
        decoration: {
          scope: scope(),
          type: {
            kind: 'FreeVariable',
            name: 'c',
          },
          implicitType: {
            kind: 'FreeVariable',
            name: 'c',
          },
        },
      }];
    }

    case 'RecordExpression': {
      const valueType = value.decoration.type;
      if (valueType.kind !== 'RecordLiteral') {
        throw new Error(`Cannot compare value of type ${valueType.kind} to record pattern in match expression`);
      }

      return flatMap(test.expression.properties, (property, name) => (
        convertPatternMatchToConditions({
          kind: 'Node',
          expression: {
            kind: 'ReadRecordPropertyExpression',
            property: name,
            record: value,
          },
          decoration: {
            type: valueType.properties[name],
            implicitType: valueType.properties[name],
            scope: scope(),
          },
        }, property)
      ));
    }

    case 'Identifier': {
      const binding = findBinding(test.decoration.scope, test.expression.name);
      if (binding) {
        // TODO return equals comparison
      }

      return [];
    }

    case 'DataInstantiation': // TODO
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'Application':
    case 'SimpleFunctionExpression':
    case 'BindingExpression':
    case 'NativeExpression':
      return [];

    default:
      return assertNever(test.expression);
  }
}

function convertPatternMatchToBindings(value: DesugaredNode, test: DesugaredNode): { name: string, value: DesugaredNode }[] {
  switch (test.expression.kind) {
    case 'Identifier':
      if (!findBinding(test.decoration.scope, test.expression.name)) {
        return [{ value, name: test.expression.name }];
      }
      return [];

    case 'SymbolExpression':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
      return [];

    case 'RecordExpression':
      const valueType = value.decoration.type;
      if (valueType.kind !== 'RecordLiteral') {
        throw new Error(`Cannot compare value of type ${valueType.kind} to record pattern in match expression`);
      }

      return flatMap(test.expression.properties, (property, name) => (
        convertPatternMatchToBindings({
          kind: 'Node',
          expression: {
            kind: 'ReadRecordPropertyExpression',
            property: name,
            record: value,
          },
          decoration: {
            type: valueType.properties[name],
            implicitType: valueType.properties[name],
            scope: scope(),
          },
        }, property)
      ));

    case 'DataInstantiation': // TODO
    case 'SimpleFunctionExpression':
    case 'Application':
    case 'BindingExpression':
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'NativeExpression':
      return [];

    default:
      return assertNever(test.expression);
  }
}

function combineConditions(conditions: DesugaredNode[], value: DesugaredNode, alternative: DesugaredNode): DesugaredNode {
  const decoration: TypedDecoration = {
    type: { // TODO types are hacky again
      kind: 'FreeVariable',
      name: 't'
    },
    implicitType: { // TODO types are hacky again
      kind: 'FreeVariable',
      name: 't'
    },
    scope: value.decoration.scope,
  };
  const combinedCondition = conditions.reduce((left, right): DesugaredNode => {
    return {
      kind: 'Node',
      decoration,
      expression: {
        kind: 'Application',
        parameter: right,
        callee: {
          kind: 'Node',
          decoration,
          expression: {
            kind: 'Application',
            parameter: left,
            callee: {
              kind: 'Node',
              decoration,
              expression: {
                kind: 'Identifier',
                name: 'and',
              },
            },
          },
        },
      },
    };
  });

  return {
    kind: 'Node',
    decoration,
    expression: {
      kind: 'Application',
      parameter: alternative,
      callee: {
        kind: 'Node',
        decoration,
        expression: {
          kind: 'Application',
          parameter: value,
          callee: {
            kind: 'Node',
            decoration,
            expression: {
              kind: 'Application',
              parameter: combinedCondition,
              callee: {
                kind: 'Node',
                decoration,
                expression: {
                  kind: 'Identifier',
                  name: 'if',
                },
              },
            },
          },
        },
      },
    },
  };
}

function makeConsequent(bindings: { name: string, value: DesugaredNode }[], body: DesugaredNode): DesugaredNode {
  const decoration: TypedDecoration = {
    type: { // TODO types are hacky again
      kind: 'FreeVariable',
      name: 't'
    },
    implicitType: { // TODO types are hacky again
      kind: 'FreeVariable',
      name: 't'
    },
    scope: body.decoration.scope,
  };
  return bindings.reduceRight<DesugaredNode>(
    (body, binding) => {
      return {
        kind: 'Node',
        decoration,
        expression: {
          kind: 'BindingExpression',
          name: binding.name,
          value: binding.value,
          body,
        },
      };
    },
    body,
  );
}

function wrapInBinding(name: string, value: DesugaredNode, body: DesugaredNode): DesugaredNode {
  return {
    kind: 'Node',
    decoration: body.decoration,
    expression: {
      kind: 'BindingExpression',
      name,
      value,
      body: body,
    },
  }
}

function shallowDesugarPatternMatch(
  { expression, decoration }: PartiallyDesugaredNode,
): DesugaredNode {
  switch (expression.kind) {
    case 'Identifier':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
    case 'SymbolExpression':
    case 'RecordExpression':
    case 'Application':
    case 'SimpleFunctionExpression':
    case 'DataInstantiation':
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'NativeExpression':
    case 'BindingExpression':
      return { expression, decoration, kind: 'Node' };

    case 'PatternMatchExpression': {
      const identifier: NodeWithExpression<TypedDecoration, Identifier> = {
        kind: 'Node',
        expression: { kind: 'Identifier', name: 'MATCH_VARIABLE$' },
        decoration: expression.value.decoration,
      };

      const patterns = expression.patterns.map((pattern) => {
        const conditions = convertPatternMatchToConditions(identifier, pattern.test);
        const bindings = convertPatternMatchToBindings(identifier, pattern.test);

        return {
          conditions,
          value: makeConsequent(bindings, pattern.value),
        };
      });

      if (patterns.length === 0) {
        throw new Error('Cannot have a pattern match with no patterns');
      }

      if (patterns.length === 1) {
        return wrapInBinding(identifier.expression.name, expression.value, patterns[0].value);
      }

      return wrapInBinding(
        identifier.expression.name,
        expression.value,
        patterns.slice(0, -1).reduce<DesugaredNode>(
          (alternative, pattern) => {
            return combineConditions(pattern.conditions, pattern.value, alternative);
          },
          patterns[patterns.length - 1].value,
        ),
      );
    }

    default:
      return assertNever(expression);
  }
}

export function desugarPatternMatch(node: DualBindingDesugaredNode): DesugaredNode {
  const internal = (node: DualBindingDesugaredNode): DesugaredNode => shallowDesugarPatternMatch(mapNode(iterator, node));
  const iterator = makeDualBindingDesugaredNodeIterator(internal);
  return internal(node);
}

export function makePatternMatchDesugaredNodeIterator<A, B>(f: (a: A) => B): (e: DesugaredExpressionWithoutPatternMatch<A>) => DesugaredExpressionWithoutPatternMatch<B> {
  return combineIteratorMap<'DesugaredExpressionWithoutPatternMatch', DesugaredExpressionWithoutPatternMatch, A, B>({
    Identifier: emptyMapIterator,
    BooleanExpression: emptyMapIterator,
    StringExpression: emptyMapIterator,
    NumberExpression: emptyMapIterator,
    SymbolExpression: emptyMapIterator,
    NativeExpression: emptyMapIterator,
    Application: applicationMapIterator,
    DataInstantiation: dataInstantiationMapIterator,
    ReadDataPropertyExpression: readDataPropertyMapIterator,
    ReadRecordPropertyExpression: readRecordPropertyMapIterator,
    SimpleFunctionExpression: simpleFunctionMapIterator,
    BindingExpression: bindingMapIterator,
    RecordExpression: recordMapIterator,
  })(f);
}

const stripDesugaredExpressionNodeWithoutPatternMatch: (n: DesugaredExpressionWithoutPatternMatch<DesugaredNode>) => DesugaredExpressionWithoutPatternMatch = (
  makePatternMatchDesugaredNodeIterator(node => stripDesugaredExpressionNodeWithoutPatternMatch(shallowStripNode(node)))
);

export function stripDesugaredNodeWithoutPatternMatch(node: DesugaredNode): DesugaredExpressionWithoutPatternMatch {
  return stripDesugaredExpressionNodeWithoutPatternMatch(shallowStripNode(node));
}
