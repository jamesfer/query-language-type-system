import {
  booleanLiteral,
  freeVariable,
  functionType,
  node,
  numberExpression,
  numberLiteral,
  recordLiteral,
  scope,
  stringExpression,
  stringLiteral,
} from '../constructors';
import { Scope } from '../types/scope';
import { attachTypeToRecord } from './attach-type-to-record';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToRecord', () => {
  let result: DeconstructedTypeState;
  let inputScope: Scope;

  describe('when a property has implicit parameters', () => {
    beforeEach(() => {
      inputScope = scope();
      result = deconstructTypeState(attachTypeToRecord(inputScope)({
        kind: 'RecordExpression',
        properties: {
          name: node(stringExpression('Hello'), { scope: inputScope, type: stringLiteral('Hello') }),
          age: node(numberExpression(7), {
            scope: inputScope,
            type: functionType(numberLiteral(7), [
              [freeVariable('a'), true],
              [booleanLiteral(true), true],
            ]),
          }),
        },
      }));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    })

    it('returns strips the implicits parameters from the attached type', () => {
      expect(result.node.decoration.type).toEqual(recordLiteral({
        name: stringLiteral('Hello'),
        age: numberLiteral(7),
      }));
    });

    it('returns the scope as the given scope', () => {
      expect(result.node.decoration.scope).toEqual(inputScope);
    });
  });
});
