import { Scope } from '../types/scope';
import { attachTypeToSymbol } from './attach-type-to-symbol';
import { scope, symbol, symbolExpression } from '../constructors';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';


describe('attachTypeToSymbol', () => {
  let result: DeconstructedTypeState;
  let inputScope: Scope;

  beforeEach(() => {
    inputScope = scope();
    result = deconstructTypeState(attachTypeToSymbol(inputScope)(symbolExpression('steve')));
  });

  it('returns no messages', () => {
    expect(result.messages).toEqual([]);
  })

  it('returns the type as a symbol', () => {
    expect(result.node.decoration.type).toEqual(symbol('steve'));
  });

  it('returns the scope as the given scope', () => {
    expect(result.node.decoration.scope).toEqual(inputScope);
  });
});
