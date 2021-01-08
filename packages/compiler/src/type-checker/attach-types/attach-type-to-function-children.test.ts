import { freeVariable, identifier, node, numberLiteral, scope, stringExpression, stringLiteral } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { Expression, FunctionExpression } from '../types/expression';
import { Node } from '../types/node';
import { Scope, ScopeBinding } from '../types/scope';
import { VariableReplacement } from '../variable-utils';
import { attachTypeToFunctionChildren } from './attach-type-to-function-children';
import { AttachedTypeDecoration, AttachedTypeNode } from './attached-type-node';
import { NumberLiteral } from '../types/value';

describe('attachTypeToFunctionChildren', () => {
  let inputScope: Scope;
  let expression: FunctionExpression;
  let defaultAttachTypesResult: Node<AttachedTypeDecoration>;
  let attachTypesMock: jest.Mock<TypeResult<AttachedTypeNode>, [Scope, Expression]>;
  let attachTypes = (scope: Scope) => (expression: Expression): TypeResult<AttachedTypeNode> => (
    attachTypesMock(scope, expression)
  );

  beforeEach(() => {
    inputScope = scope();
    expression = {
      kind: 'FunctionExpression',
      implicit: false,
      parameter: stringExpression('Parameter'),
      body: stringExpression('Body'),
    };
    defaultAttachTypesResult = node<AttachedTypeDecoration>(stringExpression('attachedType'), {
      scope: inputScope,
      type: stringLiteral('attachedType'),
    });
    attachTypesMock = jest.fn<TypeResult<AttachedTypeNode>, [Scope, Expression]>(() => (
      new TypeWriter(inputScope).wrap(defaultAttachTypesResult)
    ));
  });

  it('calls attachTypes with the parameter first', () => {
    attachTypeToFunctionChildren(inputScope)(expression)(attachTypes);
    expect(attachTypesMock).toHaveBeenNthCalledWith(1, expect.anything(), stringExpression('Parameter'));
  });

  it('calls attachTypes with the body second', () => {
    attachTypeToFunctionChildren(inputScope)(expression)(attachTypes);
    expect(attachTypesMock).toHaveBeenNthCalledWith(2, expect.anything(), stringExpression('Body'));
  });

  it('returns the result of the attachTypes function in the parameter and body', () => {
    const result = attachTypeToFunctionChildren(inputScope)(expression)(attachTypes);
    expect(result.value).toEqual({
      ...expression,
      parameter: defaultAttachTypesResult,
      body: defaultAttachTypesResult,
    });
  });

  describe('when the parameter is a free variable', () => {
    beforeEach(() => {
      expression = { ...expression, parameter: identifier('a') };
    });

    it('creates a new scope for the body with the free variables from the parameter', () => {
      attachTypeToFunctionChildren(inputScope)(expression)(attachTypes);

      const attachTypesScope: Scope = attachTypesMock.mock.calls[1][0];
      expect(attachTypesScope).not.toBe(inputScope);
      expect(attachTypesScope.bindings).toContainEqual<ScopeBinding>({
        kind: 'ScopeBinding',
        name: 'a',
        type: freeVariable('a'),
        scope: expect.anything(),
      });
    });

    describe('when attach types returns variable replacements from the parameter', () => {
      let replacedType: NumberLiteral;

      beforeEach(() => {
        replacedType = numberLiteral(7);
        // Mock the call when typing the parameter
        attachTypesMock.mockImplementationOnce(() => {
          const state = new TypeWriter(inputScope);
          state.recordReplacements([{ from: 'a', to: replacedType }]);
          return state.wrap(node(identifier('a'), {
            scope: inputScope,
            type: freeVariable('a'),
          }));
        });
      });

      it('applies variable replacements to parameter variables before adding them to the scope body', () => {
        attachTypeToFunctionChildren(inputScope)(expression)(attachTypes);
        const attachTypesScope: Scope = attachTypesMock.mock.calls[1][0];
        expect(attachTypesScope.bindings).toContainEqual<Partial<ScopeBinding>>(expect.objectContaining({
          name: 'a',
          type: replacedType,
        }));
      });

      it('applies variable replacements to parameter variables before adding them to the scope body', () => {
        const result = attachTypeToFunctionChildren(inputScope)(expression)(attachTypes);

        expect(result.state[1]).toContainEqual<VariableReplacement>({
          from: 'a',
          to: replacedType,
        });
      });
    });

    describe('when attach types returns variable replacements from the body', () => {
      let replacedType: NumberLiteral;

      beforeEach(() => {
        replacedType = numberLiteral(7);
        attachTypesMock.mockImplementation((scope, attachTypesExpression) => {
          const state = new TypeWriter(scope);
          // If we are typing the parameter
          if (attachTypesExpression.kind === 'Identifier' && attachTypesExpression.name === 'a') {
            return state.wrap(node(identifier('a'), {
              scope: inputScope,
              type: freeVariable('a'),
            }));
          } else {
            // We are typing the body
            state.recordReplacements([{ from: 'a', to: replacedType }]);
            return state.wrap(defaultAttachTypesResult);
          }
        });
      });

      it('applies replacements from the body to the parameter before returning the type', () => {
        const result = attachTypeToFunctionChildren(inputScope)(expression)(attachTypes);
        expect(result.value.parameter.decoration.type).toEqual(replacedType);
      });
    });
  });
});
