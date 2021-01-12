import {
  booleanExpression,
  booleanLiteral, freeVariable,
  identifier,
  node,
  scope,
  stringExpression,
  stringLiteral,
} from '../constructors';
import { DualExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { attachTypeToDual } from './attach-type-to-dual';
import { AttachedTypeNode } from './attached-type-node';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToDual', () => {
  let inputScope: Scope;
  let expression: DualExpression<AttachedTypeNode>;
  let result: DeconstructedTypeState;

  describe('when left and right types are compatible', () => {
    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'DualExpression',
        left: node(booleanExpression(true), { scope: inputScope, type: booleanLiteral(true) }),
        right: node(identifier('a'), { scope: inputScope, type: freeVariable('a') }),
      };
      result = deconstructTypeState(attachTypeToDual(inputScope)(expression));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    })

    it('attaches the type to the result node', () => {
      expect(result.node.decoration.type).toEqual(booleanLiteral(true));
    });

    it('returns the scope as the given scope', () => {
      expect(result.node.decoration.scope).toEqual(inputScope);
    });

    it('records variable replacements as a result of converging the two sides of the application', () => {
      expect(result.replacements).toEqual([{
        from: 'a',
        to: booleanLiteral(true),
      }]);
    });
  });

  describe('when left and right types are not compatible', () => {
    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'DualExpression',
        left: node(booleanExpression(true), { scope: inputScope, type: booleanLiteral(true) }),
        right: node(stringExpression('true'), { scope: inputScope, type: stringLiteral('true') }),
      };
      result = deconstructTypeState(attachTypeToDual(inputScope)(expression));
    });

    it('returns an error message', () => {
      expect(result.messages).toEqual(['Left and right side of dual expression are not the same type']);
    })

    it('attaches one of the types to the result node', () => {
      expect(result.node.decoration.type).toEqual(booleanLiteral(true));
    });
  });
});
