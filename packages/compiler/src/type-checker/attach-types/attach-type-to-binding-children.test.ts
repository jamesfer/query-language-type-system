import {
  booleanExpression,
  booleanLiteral,
  freeVariable,
  functionType, identifier,
  node,
  scope,
  stringExpression,
  stringLiteral,
} from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { BindingExpression, Expression } from '../types/expression';
import { Node } from '../types/node';
import { Scope, ScopeBinding } from '../types/scope';
import { attachTypeToBindingChildren } from './attach-type-to-binding-children';
import { AttachedTypeDecoration, AttachedTypeNode } from './attached-type-node';

describe('attachTypeToBindingChildren', () => {
  let inputScope: Scope;
  let expression: BindingExpression;
  let defaultAttachTypesResult: Node<AttachedTypeDecoration>;
  let attachTypesMock: jest.Mock<TypeResult<AttachedTypeNode>, [Scope, Expression]>;
  let attachTypes = (scope: Scope) => (expression: Expression): TypeResult<AttachedTypeNode> => (
    attachTypesMock(scope, expression)
  );

  beforeEach(() => {
    inputScope = scope();
    expression = {
      kind: 'BindingExpression',
      name: 'binding',
      value: stringExpression('value'),
      body: stringExpression('body'),
    };
    defaultAttachTypesResult = node<AttachedTypeDecoration>(stringExpression('attachedType'), {
      scope: inputScope,
      type: stringLiteral('attachedType'),
    });
    attachTypesMock = jest.fn<TypeResult<AttachedTypeNode>, [Scope, Expression]>(() => (
      new TypeWriter(inputScope).wrap(defaultAttachTypesResult)
    ));
  });

  it('calls attachTypes with the value first', () => {
    attachTypeToBindingChildren(inputScope)(expression)(attachTypes);
    expect(attachTypesMock).toHaveBeenNthCalledWith(1, expect.anything(), stringExpression('value'));
  });

  it('calls attachTypes with the body second', () => {
    attachTypeToBindingChildren(inputScope)(expression)(attachTypes);
    expect(attachTypesMock).toHaveBeenNthCalledWith(2, expect.anything(), stringExpression('body'));
  });

  it('includes replacements from the value in the result state', () => {
    attachTypesMock.mockImplementation((scope, attachTypesExpression) => {
      if (attachTypesExpression.kind === 'StringExpression' && attachTypesExpression.value === 'value') {
        // We are typing the value
        const state = new TypeWriter(scope);
        state.recordReplacements([{ from: 'a', to: booleanLiteral(true) }]);
        return state.wrap(defaultAttachTypesResult);
      }

      // We are typing the body
      return new TypeWriter(scope).wrap(defaultAttachTypesResult);
    });

    const result = attachTypeToBindingChildren(inputScope)(expression)(attachTypes);
    expect(result.state[1]).toEqual([{ from: 'a', to: booleanLiteral(true) }]);
  });

  it('includes replacements from the body in the result state', () => {
    attachTypesMock.mockImplementation((scope, attachTypesExpression) => {
      if (attachTypesExpression.kind === 'StringExpression' && attachTypesExpression.value === 'value') {
        // We are typing the value
        return new TypeWriter(scope).wrap(defaultAttachTypesResult);
      }

      // We are typing the body
      const state = new TypeWriter(scope);
      state.recordReplacements([{ from: 'a', to: booleanLiteral(true) }]);
      return state.wrap(defaultAttachTypesResult);
    });

    const result = attachTypeToBindingChildren(inputScope)(expression)(attachTypes);
    expect(result.state[1]).toEqual([{ from: 'a', to: booleanLiteral(true) }]);
  });

  describe('when the attached type of the value has implicit parameters', () => {
    let i: number;

    beforeEach(() => {
      i = 0;
      attachTypesMock.mockImplementation((scope, attachTypesExpression) => {
        i++;
        if (i === 1) {
          // We are typing the value
          return new TypeWriter(scope).wrap(node(attachTypesExpression as any, {
            scope,
            type: functionType(stringLiteral('value'), [[booleanLiteral(true), true], [freeVariable('a'), true]]),
          }));
        }

        // We are typing the body
        return new TypeWriter(scope).wrap(defaultAttachTypesResult);
      });
    });

    it('strips implicit types on the value binding when calling attachTypes on the body', () => {
      attachTypeToBindingChildren(inputScope)(expression)(attachTypes);
      const attachTypes2ndScope = attachTypesMock.mock.calls[1][0];
      expect(attachTypes2ndScope.bindings).toContainEqual<ScopeBinding>({
        kind: 'ScopeBinding',
        name: 'binding',
        scope: inputScope,
        type: stringLiteral('value'),
      });
    });

    it('maintains implicit types on the value binding when it is an implicit function literal definition', () => {
      expression = {
        ...expression,
        value: {
          kind: 'FunctionExpression',
          implicit: true,
          parameter: booleanExpression(true),
          body: {
            kind: 'FunctionExpression',
            implicit: true,
            parameter: identifier('a'),
            body: stringExpression('value'),
          },
        },
      };

      attachTypeToBindingChildren(inputScope)(expression)(attachTypes);
      const attachTypes2ndScope = attachTypesMock.mock.calls[1][0];
      expect(attachTypes2ndScope.bindings).toContainEqual<ScopeBinding>({
        kind: 'ScopeBinding',
        name: 'binding',
        scope: inputScope,
        type: functionType(stringLiteral('value'), [[booleanLiteral(true), true], [freeVariable('a'), true]]),
      });
    });
  });
});
