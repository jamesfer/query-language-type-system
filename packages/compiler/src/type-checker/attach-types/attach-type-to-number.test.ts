import { numberExpression, numberLiteral, scope } from '../constructors';
import { Scope } from '../types/scope';
import { attachTypeToNumber } from './attach-type-to-number';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToNumber', () => {
  let result: DeconstructedTypeState;
  let inputScope: Scope;

  beforeEach(() => {
    inputScope = scope();
    result = deconstructTypeState(attachTypeToNumber(inputScope)(numberExpression(714)));
  });

  it('returns no messages', () => {
    expect(result.messages).toEqual([]);
  })

  it('returns the type as a number', () => {
    expect(result.node.decoration.type).toEqual(numberLiteral(714));
  });

  it('returns the scope as the given scope', () => {
    expect(result.node.decoration.scope).toEqual(inputScope);
  });
});
