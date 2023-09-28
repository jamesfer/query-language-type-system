import { mergePartialTypes } from './merge-partial-types';
import { CollapsedInferredType, InferredType } from '../types/inferred-type';
import { functionType, identifier, numberLiteral } from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../..';
import { Either } from 'fp-ts/Either';
import { NamedPartialType } from './partial-type';

function swapOrder<T>(left: T, right: T): [string, [T, T]][] {
  return [
    ['default order', [left, right]],
    ['swapped order', [right, left]],
  ];
}

describe('mergePartialTypes', () => {
  const defaultSource: InferredType = {
    from: 'a',
    operator: 'Equals',
    to: numberLiteral(1),
    inferrer: identifier('testIdentifier'),
    origin: identifier('testIdentifier'),
  };
  let messageState: StateRecorder<Message>;
  let assumptionsState: StateRecorder<Either<NamedPartialType, NamedPartialType>>;

  beforeEach(() => {
    messageState = new StateRecorder();
    assumptionsState = new StateRecorder();
  });

  it('successfully merges two identical relationships', () => {
    const aEquals1: CollapsedInferredType = {
      from: 'a',
      operator: 'Equals',
      to: numberLiteral(1),
      sources: [defaultSource],
    };
    expect(mergePartialTypes(messageState, assumptionsState, aEquals1, aEquals1)).toEqual({
      operator: 'Equals',
      to: numberLiteral(1),
    });
    expect(messageState.values).toEqual([]);
    expect(assumptionsState.values).toEqual([]);
  });

  describe('when merging types with identical concrete parts', () => {
    const aEqualsImplicitFunction: CollapsedInferredType = {
      from: 'a',
      operator: 'Equals',
      to: functionType(numberLiteral(1), [[numberLiteral(2), true]]),
      sources: [defaultSource],
    };
    const aEvaluatesTo1: CollapsedInferredType = {
      from: 'a',
      operator: 'EvaluatesTo',
      to: numberLiteral(1),
      sources: [defaultSource],
    };

    it.each(swapOrder(
      aEqualsImplicitFunction,
      aEvaluatesTo1,
    ))('retains implicit parameters when given in %s', (_, [left, right]) => {
      expect(mergePartialTypes(messageState, assumptionsState, left, right)).toEqual({
        operator: 'Equals',
        to: functionType(numberLiteral(1), [[numberLiteral(2), true]]),
      });
      expect(messageState.values).toEqual([]);
      expect(assumptionsState.values).toEqual([]);
    });
  });

  // it('retains implicit parameters when concrete parts need inferring', () => {
  //   const existing: CollapsedInferredType = {
  //     from: 'a',
  //     operator: 'Equals',
  //     to: functionType(freeVariable('b'), [[numberLiteral(2), true]]),
  //     sources: [defaultSource],
  //   };
  //   const next: CollapsedInferredType = {
  //     from: 'a',
  //     operator: 'EvaluatesTo',
  //     to: numberLiteral(1),
  //     sources: [defaultSource],
  //   };
  //   expect(mergeTypeRelations(messageState, next)(existing)).toEqual([
  //     {
  //       from: 'b',
  //       operator: 'EvaluatesTo',
  //       to: numberLiteral(1),
  //       sources: expect.any(Array),
  //     },
  //   ]);
  //   expect(messageState.values).toEqual([]);
  // });
});
