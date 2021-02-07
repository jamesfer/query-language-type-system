import { identifier, numberLiteral } from '../constructors';
import { InferredType } from '../converge-values/converge-types';
import { Value } from '../types/value';
import { validateInferredTypes } from './validate-inferred-types';

describe('validateInferredTypes', () => {
  // let testCases = [
  //   [
  //     'a = (7 -> 7) -> 7',
  //     'a = b',
  //     'b = c -> d',
  //     ''
  //   ],
  // ];

  function inferredType(from: string, to: Value): InferredType {
    return {
      from,
      to,
      originatingExpression: identifier('originating'),
      inferringExpression: identifier('inferring'),
    };
  }

  it('passes non-conflicting inferred types', () => {
    const inputInferredTypes = [
      inferredType('a', numberLiteral(7)),
      inferredType('b', numberLiteral(8)),
    ];
    const [messages, inferredTypes] = validateInferredTypes(inputInferredTypes);
    expect(messages).toEqual([]);
    expect(inferredTypes).toEqual(inputInferredTypes);
  });
});
