// Test cases

// a exactly x -> y
// a evaluated impl w -> x -> y
// pass

// a exactly impl w -> x -> y
// a evaluated impl w -> x -> y
// fail

// a exactly n
// n exactly impl w -> x -> y
// a = impl w -> x -> y

// a evaluated n
// n exactly impl w -> x -> y
// a = x -> y

// a evaluated n
// n exactly impl w -> x -> y
// a exactly x -> y
// pass






// We can just apply replacements to all types as soon as they join the reduced stack because their
// values are dependent on the relationship. If we have `a evaluated n`, we can't replace all the
// a's with n's because we lose the fact that those a's need to be the evaluated result of n.

// What we leave applying all the replacements until the last minute. Instead, when we are
// converging values, we can just assume that identifiers with the same name will be identical. We
// don't need to apply those replacements. When doing this we need to perform another check that
// the implicits are the same. If we have `a evaluated n` and `a exactly n`. When the actual value
// for n is inserted, we need to check that it doesn't come with implicits as that would be
// forbidden in this example. This check would also need to work in the scenario of
// `a evaluated impl w -> n` and `a exactly n`. `n` here needs to have no implicits. in the scenario
// of `a evaluated impl w -> n` and `a evaluated n`, `n` could have any implicits.

// `a evaluated x`, `a exactly y`, we guess the value of y in `y evaluated x`
// `a exactly x`, `a exactly y`, we guess the value of y in `y exactly x`
// `a evaluated x`, `a evaluated y`, we can't guess the value of y because it could be
// `y evaluated x` or `x evaluated y`.


import {
  freeVariable,
  functionType,
  identifier,
  numberLiteral,
  recordLiteral,
} from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { InferredType, InferredTypeOperator, makeInferredType } from '../types/inferred-type';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { collapseInferredTypes } from './collapse-inferred-types';

function inferredType(from: string, kind: InferredTypeOperator, to: Value): InferredType {
  return makeInferredType(kind, from, to, identifier('origin'), identifier('inferrer'));
}

describe('collapseInferredTypes', () => {
  let messageState: StateRecorder<Message>;

  beforeEach(() => {
    messageState = new StateRecorder<Message>();
  });

  it('collapses relationships with compatible plain values', () => {
    collapseInferredTypes(messageState, [
      inferredType('d', 'Equals', recordLiteral({ g: numberLiteral(1), h: numberLiteral(2) })),
      inferredType('d', 'Equals', recordLiteral({ g: numberLiteral(1), h: numberLiteral(2) })),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('fails relationships with incompatible plain values', () => {
    collapseInferredTypes(messageState, [
      inferredType('d', 'Equals', recordLiteral({ g: numberLiteral(1), h: numberLiteral(2) })),
      inferredType('d', 'Equals', recordLiteral({ g: numberLiteral(2), h: numberLiteral(1) })),
    ]);
    expect(messageState.values).toEqual([expect.any(String), expect.any(String)]);
  });

  it('collapses an exact relationship with an implicit evaluated one', () => {
    collapseInferredTypes(messageState, [
      inferredType('d', 'Equals', functionType(freeVariable('b'), [freeVariable('a')])),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('b'), [[freeVariable('x'), true], freeVariable('a')])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('fails on exact and evaluated relationships that are both implicit', () => {
    collapseInferredTypes(messageState, [
      inferredType('d', 'Equals', functionType(freeVariable('b'), [[freeVariable('x'), true], freeVariable('a')])),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('b'), [[freeVariable('x'), true], freeVariable('a')])),
    ]);
    expect(messageState.values).toEqual([expect.any(String)]);
  });

  it('collapses an exact relationship with an implicit evaluated to a common free variable', () => {
    collapseInferredTypes(messageState, [
      inferredType('d', 'Equals', freeVariable('a')),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('a'), [[freeVariable('x'), true]])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('collapses an evaluated relationship with exact one', () => {
    collapseInferredTypes(messageState, [
      inferredType('d', 'EvaluatedFrom', freeVariable('a')),
      inferredType('d', 'Equals', functionType(numberLiteral(123), [freeVariable('x')])),
      inferredType('a', 'Equals', functionType(numberLiteral(123), [[freeVariable('y'), true], freeVariable('x')])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('collapses an exact relationship with an implicit evaluated to an existing common free variable', () => {
    collapseInferredTypes(messageState, [
      inferredType('a', 'Equals', numberLiteral(1)),
      inferredType('d', 'Equals', freeVariable('a')),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('a'), [[freeVariable('x'), true]])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('fails an exact relationship with an implicit evaluated to an incompatible existing common free variable', () => {
    collapseInferredTypes(messageState, [
      inferredType('a', 'Equals', functionType(numberLiteral(1), [[freeVariable('y'), true]])),
      inferredType('d', 'Equals', freeVariable('a')),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('a'), [[freeVariable('x'), true]])),
    ]);
    expect(messageState.values).toEqual([expect.any(String)]);
  });

  it('collapses an evaluated relationship without implicits, with an exact relationship with implicits', () => {
    collapseInferredTypes(messageState, [
      inferredType('d', 'EvaluatesTo', functionType(numberLiteral(1), [freeVariable('y')])),
      inferredType('d', 'Equals', functionType(numberLiteral(1), [[freeVariable('x'), true], freeVariable('y')])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('fails when two evaluated relationships have different implicits', () => {
    collapseInferredTypes(messageState, [
      inferredType('d', 'EvaluatedFrom', functionType(numberLiteral(1), [[numberLiteral(20), true], freeVariable('y')])),
      inferredType('d', 'EvaluatedFrom', functionType(numberLiteral(1), [[numberLiteral(10), true], freeVariable('y')])),
    ]);
    expect(messageState.values).toEqual([expect.any(String)]);
  });
});
