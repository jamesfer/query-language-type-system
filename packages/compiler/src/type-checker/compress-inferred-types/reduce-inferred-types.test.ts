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
import { reduceInferredTypes } from './reduce-inferred-types';

function inferredType(from: string, kind: InferredTypeOperator, to: Value): InferredType {
  return makeInferredType(kind, from, to, identifier('origin'), identifier('inferrer'));
}

describe('reduceInferredTypes', () => {
  let messageState: StateRecorder<Message>;

  beforeEach(() => {
    messageState = new StateRecorder<Message>();
  });

  it('collapses relationships with compatible plain values', () => {
    reduceInferredTypes(messageState, [
      inferredType('d', 'Equals', recordLiteral({ g: numberLiteral(1), h: numberLiteral(2) })),
      inferredType('d', 'Equals', recordLiteral({ g: numberLiteral(1), h: numberLiteral(2) })),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('fails relationships with incompatible plain values', () => {
    reduceInferredTypes(messageState, [
      inferredType('d', 'Equals', recordLiteral({ g: numberLiteral(1), h: numberLiteral(2) })),
      inferredType('d', 'Equals', recordLiteral({ g: numberLiteral(2), h: numberLiteral(1) })),
    ]);
    expect(messageState.values).toEqual([expect.any(String), expect.any(String)]);
  });

  it('collapses an exact relationship with an implicit evaluated one', () => {
    reduceInferredTypes(messageState, [
      inferredType('d', 'Equals', functionType(freeVariable('b'), [freeVariable('a')])),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('b'), [[freeVariable('x'), true], freeVariable('a')])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('fails on exact and evaluated relationships that are both implicit', () => {
    reduceInferredTypes(messageState, [
      inferredType('d', 'Equals', functionType(freeVariable('b'), [[freeVariable('x'), true], freeVariable('a')])),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('b'), [[freeVariable('x'), true], freeVariable('a')])),
    ]);
    expect(messageState.values).toEqual([expect.any(String)]);
  });

  it('collapses an exact relationship with an implicit evaluated to a common free variable', () => {
    reduceInferredTypes(messageState, [
      inferredType('d', 'Equals', freeVariable('a')),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('a'), [[freeVariable('x'), true]])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('collapses an evaluated relationship with exact one', () => {
    reduceInferredTypes(messageState, [
      inferredType('d', 'EvaluatedFrom', freeVariable('a')),
      inferredType('d', 'Equals', functionType(numberLiteral(123), [freeVariable('x')])),
      inferredType('a', 'Equals', functionType(numberLiteral(123), [[freeVariable('y'), true], freeVariable('x')])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('collapses an exact relationship with an implicit evaluated to an existing common free variable', () => {
    reduceInferredTypes(messageState, [
      inferredType('a', 'Equals', numberLiteral(1)),
      inferredType('d', 'Equals', freeVariable('a')),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('a'), [[freeVariable('x'), true]])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('fails an exact relationship with an implicit evaluated to an incompatible existing common free variable', () => {
    const x = reduceInferredTypes(messageState, [
      inferredType('a', 'Equals', functionType(numberLiteral(1), [[freeVariable('y'), true]])),
      inferredType('d', 'Equals', freeVariable('a')),
      inferredType('d', 'EvaluatedFrom', functionType(freeVariable('a'), [[freeVariable('x'), true]])),
    ]);
    expect(messageState.values).toEqual([expect.any(String)]);
  });

  it('collapses an evaluated relationship without implicits, with an exact relationship with implicits', () => {
    reduceInferredTypes(messageState, [
      inferredType('d', 'EvaluatesTo', functionType(numberLiteral(1), [freeVariable('y')])),
      inferredType('d', 'Equals', functionType(numberLiteral(1), [[freeVariable('x'), true], freeVariable('y')])),
    ]);
    expect(messageState.values).toEqual([]);
  });

  it('fails when two evaluated relationships have different implicits', () => {
    reduceInferredTypes(messageState, [
      inferredType('d', 'EvaluatedFrom', functionType(numberLiteral(1), [[numberLiteral(20), true], freeVariable('y')])),
      inferredType('d', 'EvaluatedFrom', functionType(numberLiteral(1), [[numberLiteral(10), true], freeVariable('y')])),
    ]);
    expect(messageState.values).toEqual([expect.any(String)]);
  });

  it('xxx', () => {
    const result = reduceInferredTypes(messageState, [
      inferredType('a', 'Equals', functionType(numberLiteral(123), [[freeVariable('y'), true], freeVariable('x')])),
      inferredType('d', 'EvaluatedFrom', freeVariable('a')),
    ]);

    expect(result['d']).toEqual({
      operator: 'EvaluatedFrom',
      from: 'd',
      to: freeVariable('a'),
      sources: expect.anything(),
    });
  });
});
