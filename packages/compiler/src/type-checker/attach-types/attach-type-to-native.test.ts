import { uniqueIdStream } from '../../utils/unique-id-generator';
import { booleanExpression, booleanLiteral, freeVariable, scope } from '../constructors';
import { Scope } from '../types/scope';
import { attachTypeToNative } from './attach-type-to-native';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToNative', () => {
  let result: DeconstructedTypeState;
  let inputScope: Scope;

  beforeEach(() => {
    inputScope = scope();
    result = deconstructTypeState(attachTypeToNative(inputScope)(uniqueIdStream(), {
      kind: 'NativeExpression',
      data: {},
    }));
  });

  it('returns no messages', () => {
    expect(result.messages).toEqual([]);
  })

  it('returns the type as a unique free variable', () => {
    expect(result.node.decoration.type).toEqual(freeVariable('native$1'));
  });

  it('returns the scope as the given scope', () => {
    expect(result.node.decoration.scope).toEqual(inputScope);
  });
});
