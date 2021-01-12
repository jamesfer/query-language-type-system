import {
  booleanLiteral,
  freeVariable,
  functionType,
  identifier,
  numberExpression,
  numberLiteral,
} from '../constructors';
import { booleanExpression, node, scope } from '../constructors';
import { BindingExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { attachTypeToBinding } from './attach-type-to-binding';
import { AttachedTypeNode } from './attached-type-node';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToBinding', () => {
  let expression: BindingExpression<AttachedTypeNode>;
  let inputScope: Scope;
  let result: DeconstructedTypeState;

  describe('when the body has an implicit type', () => {
    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'BindingExpression',
        name: 'X',
        body: node(identifier('body'), {
          scope: inputScope,
          type: functionType(booleanLiteral(true), [[numberLiteral(7), true], [freeVariable('a'), true]]),
        }),
        value: node(numberExpression(100), { scope: inputScope, type: numberLiteral(100) }),
      };
      result = deconstructTypeState(attachTypeToBinding(inputScope)(expression));
    });

    it('strips the implicits before attaching it to the expression', () => {
      expect(result.node.decoration.type).toEqual(booleanLiteral(true));
    });
  });
});
