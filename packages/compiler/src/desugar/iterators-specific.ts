import { Kind, URIS } from 'fp-ts/lib/HKT';
import { mapValues } from 'lodash';
import {
  Application,
  BindingExpression,
  BooleanExpression,
  DataInstantiation,
  DualExpression,
  Expression,
  FunctionExpression,
  Identifier,
  NativeExpression,
  Node,
  NodeWithExpression,
  NumberExpression,
  PatternMatchExpression,
  ReadDataPropertyExpression,
  ReadRecordPropertyExpression,
  RecordExpression,
  StringExpression,
  SymbolExpression,
  TypedNode,
} from '..';
import { TypedDecoration } from '../type-checker/type-check';
import { DesugaredExpressionWithoutDestructuring } from './desugar-destructuring';
import { combineIteratorMap } from './iterators-core';

// export function passThroughNodeIterator<A, B, D>(f: (value: A) => B): (node: NodeWithExpression<D, A>) => NodeWithExpression<D, B> {
//   return passThroughIterator('expression')(f);
// }
//
// export function strippingNodeIterator<A, B, D>(f: (value: A) => B): (node: NodeWithExpression<D, A>) => B {
//   return node => f(node.expression);
// }

// type Keys<K extends string, E extends { kind: string }> = E extends { kind: K } ? keyof E : never;
//
// const expressionChildPropertyMap: { [K in Expression['kind']]: Keys<K, Expression>[] } = {
//   Application: ['callee'],
//   DataInstantiation: ['callee', 'parameters']
// };

export function emptyMapIterator<A, B, E extends Identifier | BooleanExpression | StringExpression | NumberExpression | SymbolExpression | NativeExpression>(f: (a: A) => B): (expression: E) => E {
  return expression => expression;
}

export function applicationMapIterator<A, B>(f: (a: A) => B): (expression: Application<A>) => Application<B> {
  return expression => ({
    ...expression,
    callee: f(expression.callee),
    parameter: f(expression.parameter),
  });
}

export function dataInstantiationMapIterator<A, B>(f: (a: A) => B): (expression: DataInstantiation<A>) => DataInstantiation<B> {
  return expression => ({
    ...expression,
    callee: f(expression.callee),
    parameters: expression.parameters.map(f),
  });
}

export function readDataPropertyMapIterator<A, B>(f: (a: A) => B): (expression: ReadDataPropertyExpression<A>) => ReadDataPropertyExpression<B> {
  return expression => ({
    ...expression,
    dataValue: f(expression.dataValue),
  });
}

export function readRecordPropertyMapIterator<A, B>(f: (a: A) => B): (expression: ReadRecordPropertyExpression<A>) => ReadRecordPropertyExpression<B> {
  return expression => ({
    ...expression,
    record: f(expression.record),
  });
}

export function functionMapIterator<A, B>(f: (a: A) => B): (expression: FunctionExpression<A>) => FunctionExpression<B> {
  return expression => ({
    ...expression,
    parameter: f(expression.parameter),
    body: f(expression.body),
  });
}

export function dualMapIterator<A, B>(f: (a: A) => B): (expression: DualExpression<A>) => DualExpression<B> {
  return expression => ({
    ...expression,
    left: f(expression.left),
    right: f(expression.right),
  });
}

export function bindingMapIterator<A, B>(f: (a: A) => B): (expression: BindingExpression<A>) => BindingExpression<B> {
  return expression => ({
    ...expression,
    body: f(expression.body),
    value: f(expression.value),
  });
}

export function patternMatchMapIterator<A, B>(f: (a: A) => B): (expression: PatternMatchExpression<A>) => PatternMatchExpression<B> {
  return expression => ({
    ...expression,
    value: f(expression.value),
    patterns: expression.patterns.map(pattern => ({
      ...pattern,
      value: f(pattern.value),
      test: f(pattern.test),
    })),
  });
}

export function recordMapIterator<A, B>(f: (a: A) => B): (expression: RecordExpression<A>) => RecordExpression<B> {
  return expression => ({
    ...expression,
    properties: mapValues(expression.properties, f),
  });
}

export function makeExpressionIterator<A, B>(f: (a: A) => B): (e: Expression<A>) => Expression<B> {
  return combineIteratorMap<'Expression', Expression, A, B>({
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
    FunctionExpression: functionMapIterator,
    DualExpression: dualMapIterator,
    BindingExpression: bindingMapIterator,
    PatternMatchExpression: patternMatchMapIterator,
    RecordExpression: recordMapIterator,
  })(f);
}

export function shallowStripNode<D, A>(node: NodeWithExpression<D, A>): A {
  return node.expression;
}

export function makeStripNode<D>(
  makeIterator: <A, B>(f: (a: A) => B) => (e: Expression<A>) => Expression<B>,
): (n: Expression<Node<D>>) => Expression {
  const iterator: (n: Expression<Node<D>>) => Expression = (
    makeIterator(node => iterator(shallowStripNode(node)))
  );
  return iterator;
}

export const stripExpressionNodes = makeStripNode(makeExpressionIterator);

export function stripNode<D>(node: Node<D>) {
  return stripExpressionNodes(shallowStripNode(node));
}




// function reduceExpression<A>(f: (input: Expression<A>) => A): (input: Expression) => A {
//   // Doesn't work, will just cause infinite loop
//   const nestedIterator = (expression: Expression) => reduceIterator(expression);
//   const iterators: ReductionIteratorMap<Expression['kind'], Expression, Expression, A> = {
//     Identifier: f,
//     BooleanExpression: f,
//     StringExpression: f,
//     NumberExpression: f,
//     SymbolExpression: f,
//     DataInstantiation: nestedIterator,
//     Application: applicationMapIterator(f),
//     ReadDataPropertyExpression: nestedIterator,
//     ReadRecordPropertyExpression: nestedIterator,
//     FunctionExpression: nestedIterator,
//     DualExpression: nestedIterator,
//     BindingExpression: nestedIterator,
//     NativeExpression: nestedIterator,
//     PatternMatchExpression: nestedIterator,
//     RecordExpression: nestedIterator,
//   };
//   const reduceIterator = makeReduceIterator<'Expression', Expression, Expression, A>(iterators);
//   return reduceIterator;
// }

// function a<D, A>(f: NodeWithExpression<D, A>): (node: NodeWithExpression<D, any>)
