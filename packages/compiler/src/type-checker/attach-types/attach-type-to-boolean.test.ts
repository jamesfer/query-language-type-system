import { booleanExpression, booleanLiteral, scope } from '../constructors';
import { Scope } from '../types/scope';
import { attachTypeToBoolean } from './attach-type-to-boolean';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToBoolean', () => {
  let result: DeconstructedTypeState;
  let inputScope: Scope;

  beforeEach(() => {
    inputScope = scope();
    result = deconstructTypeState(attachTypeToBoolean(inputScope)(booleanExpression(true)));
  });

  it('returns no messages', () => {
    expect(result.messages).toEqual([]);
  })

  it('returns the type as a boolean', () => {
    expect(result.node.decoration.type).toEqual(booleanLiteral(true));
  });

  it('returns the scope as the given scope', () => {
    expect(result.node.decoration.scope).toEqual(inputScope);
  });
});
