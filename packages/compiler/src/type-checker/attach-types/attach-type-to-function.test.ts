import {
  booleanLiteral,
  freeVariable,
  functionType,
  identifier,
  node,
  numberLiteral,
  scope,
  stringLiteral,
} from '../constructors';
import { FunctionExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { attachTypeToFunction } from './attach-type-to-function';
import { AttachedTypeNode } from './attached-type-node';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToFunction', () => {
  describe('when the body is not another function', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: FunctionExpression<AttachedTypeNode>;

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'FunctionExpression',
        implicit: false,
        parameter: node(
          identifier('parameter'),
          {
            scope: inputScope,
            type: functionType(stringLiteral('Hello'), [
              [freeVariable('a'), true],
              [numberLiteral(7), true],
            ]),
          },
        ),
        body: node(
          {
            kind: 'BooleanExpression',
            value: true,
          },
          {
            scope: inputScope,
            type: functionType(booleanLiteral(true), [
              [freeVariable('a'), true],
              [numberLiteral(7), true],
            ]),
          },
        ),
      };
      result = deconstructTypeState(attachTypeToFunction(inputScope)(expression));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('strips all implicits in the attached type', () => {
      expect(result.node.decoration.type).toEqual(functionType(booleanLiteral(true), [stringLiteral('Hello')]));
    });

    it('produces no variable replacements', () => {
      expect(result.replacements).toEqual([]);
    });
  });

  describe('when the body is an implicit function', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: FunctionExpression<AttachedTypeNode>;

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'FunctionExpression',
        implicit: false,
        parameter: node(
          identifier('parameter'),
          {
            scope: inputScope,
            type: functionType(stringLiteral('Hello'), [
              [freeVariable('a'), true],
              [numberLiteral(7), true],
            ]),
          },
        ),
        body: node(
          {
            kind: 'FunctionExpression',
            implicit: true,
            parameter: node(
              identifier('implicitParameter'),
              {
                scope: inputScope,
                type: booleanLiteral(true),
              },
            ),
            body: node(
              {
                kind: 'FunctionExpression',
                implicit: false,
                parameter: node(
                  identifier('explicitParameter'),
                  {
                    scope: inputScope,
                    type: numberLiteral(7),
                  },
                ),
                body: node(
                  identifier('body'),
                  {
                    scope: inputScope,
                    type: stringLiteral('Hello'),
                  },
                ),
              },
              {
                scope: inputScope,
                type: functionType(stringLiteral('Hello'), [numberLiteral(7)]),
              },
            ),
          },
          {
            scope: inputScope,
            type: functionType(stringLiteral('Hello'), [
              [booleanLiteral(true), true],
              numberLiteral(7),
            ]),
          },
        ),
      };
      result = deconstructTypeState(attachTypeToFunction(inputScope)(expression));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('does not strip implicits from the body in the attached type', () => {
      expect(result.node.decoration.type).toEqual(functionType(stringLiteral('Hello'), [
        stringLiteral('Hello'),
        [booleanLiteral(true), true],
        numberLiteral(7),
      ]));
    });

    it('produces no variable replacements', () => {
      expect(result.replacements).toEqual([]);
    });
  });

  describe('when it is an implicit function', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: FunctionExpression<AttachedTypeNode>;

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'FunctionExpression',
        implicit: true,
        parameter: node(
          identifier('parameter'),
          {
            scope: inputScope,
            type: stringLiteral('Hello'),
          },
        ),
        body: node(
          {
            kind: 'BooleanExpression',
            value: true,
          },
          {
            scope: inputScope,
            type: booleanLiteral(true),
          },
        ),
      };
      result = deconstructTypeState(attachTypeToFunction(inputScope)(expression));
    });

    it('attaches an implicit function type to the expression', () => {
      expect(result.node.decoration.type).toEqual(functionType(booleanLiteral(true), [[stringLiteral('Hello'), true]]));
    });
  });
});
