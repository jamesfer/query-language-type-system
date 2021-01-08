import { scope, stringExpression, stringLiteral } from '../constructors';
import { Scope } from '../types/scope';
import { attachTypeToString } from './attach-type-to-string';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToString', () => {
  let result: DeconstructedTypeState;
  let inputScope: Scope;

  beforeEach(() => {
    inputScope = scope();
    result = deconstructTypeState(attachTypeToString(inputScope)(stringExpression('a string')));
  });

  it('returns no messages', () => {
    expect(result.messages).toEqual([]);
  })

  it('returns the type as a boolean', () => {
    expect(result.node.decoration.type).toEqual(stringLiteral('a string'));
  });

  it('returns the scope as the given scope', () => {
    expect(result.node.decoration.scope).toEqual(inputScope);
  });
});
