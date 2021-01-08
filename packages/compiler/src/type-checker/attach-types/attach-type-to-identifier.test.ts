import { booleanLiteral, freeVariable, functionType, identifier, numberLiteral, scope } from '../constructors';
import { Scope } from '../types/scope';
import { Value } from '../types/value';
import { attachTypeToIdentifier } from './attach-type-to-identifier';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToIdentifier', () => {
  let result: DeconstructedTypeState;
  let inputScope: Scope;

  describe('when the scope is empty', () => {
    beforeEach(() => {
      inputScope = scope();
      result = deconstructTypeState(attachTypeToIdentifier(inputScope)(identifier('a')));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('returns the type as a new free variable', () => {
      expect(result.node.decoration.type).toEqual(freeVariable('a'));
    });

    it('returns the scope as the given scope', () => {
      expect(result.node.decoration.scope).toEqual(inputScope);
    });
  });

  describe('when the scope has the type of the binding', () => {
    let type: Value;

    beforeEach(() => {
      type = booleanLiteral(true);
      inputScope = scope({
        bindings: [{
          type,
          kind: 'ScopeBinding',
          name: 'a',
          scope: scope(),
        }],
      });
      result = deconstructTypeState(attachTypeToIdentifier(inputScope)(identifier('a')));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('returns the type as what is in the scope', () => {
      expect(result.node.decoration.type).toEqual(type);
    });

    it('returns the scope as the given scope', () => {
      expect(result.node.decoration.scope).toEqual(inputScope);
    });
  });

  describe('when the type of the identifier has implicit parameters', () => {
    let type: Value;

    beforeEach(() => {
      type = functionType(booleanLiteral(true), [
        [freeVariable('a'), true],
        [numberLiteral(78), true],
      ]);
      inputScope = scope({
        bindings: [{
          type,
          kind: 'ScopeBinding',
          name: 'a',
          scope: scope(),
        }],
      });
      result = deconstructTypeState(attachTypeToIdentifier(inputScope)(identifier('a')));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('returns the type with the implicit parameters', () => {
      expect(result.node.decoration.type).toEqual(type);
    });

    it('returns the scope as the given scope', () => {
      expect(result.node.decoration.scope).toEqual(inputScope);
    });
  });
});
