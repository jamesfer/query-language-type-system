import { Application } from '../types/expression';
import { AttachedTypeNode } from './attached-type-node';
import { booleanLiteral, dataValue, freeVariable, functionType, node, numberLiteral, scope } from '../constructors';
import { DeconstructedTypeState, deconstructTypeState } from './test-utils/deconstruct-type-state';
import { Scope } from '../types/scope';
import { attachTypeToApplication } from './attach-type-to-application';
import { uniqueIdStream } from '../../utils/unique-id-generator';

describe('attachTypeToApplication', () => {
  describe('with an expression of (true -> true) true', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: Application<AttachedTypeNode>

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'Application',
        callee: node(
          {
            kind: 'Identifier',
            name: 'callee',
          },
          {
            scope: inputScope,
            type: functionType(booleanLiteral(true), [booleanLiteral(true)]),
          },
        ),
        parameter: node(
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
      result = deconstructTypeState(attachTypeToApplication(uniqueIdStream())(inputScope)(expression));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('attaches true as the type of the expression', () => {
      expect(result.node.decoration.type).toEqual(booleanLiteral(true));
    });

    it('produces no variable replacements', () => {
      expect(result.replacements).toEqual([]);
    });
  });

  describe('when the callee is not callable', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: Application<AttachedTypeNode>

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'Application',
        callee: node(
          {
            kind: 'Identifier',
            name: 'callee',
          },
          {
            scope: inputScope,
            type: booleanLiteral(true),
          },
        ),
        parameter: node(
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
      result = deconstructTypeState(attachTypeToApplication(uniqueIdStream())(inputScope)(expression));
    });

    it('emits an error message', () => {
      expect(result.messages).toEqual([
        'Cannot call an expression of type BooleanLiteral',
      ]);
    });

    it('attaches a free variable as the expression type', () => {
      expect(result.node.decoration.type).toEqual(freeVariable('applicationResult$1'));
    });
  });

  describe('when the parameter does not match the expected shape', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: Application<AttachedTypeNode>

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'Application',
        callee: node(
          {
            kind: 'Identifier',
            name: 'callee',
          },
          {
            scope: inputScope,
            type: functionType(booleanLiteral(true), [booleanLiteral(true)]),
          },
        ),
        parameter: node(
          {
            kind: 'NumberExpression',
            value: 7,
          },
          {
            scope: inputScope,
            type: numberLiteral(7),
          },
        ),
      };
      result = deconstructTypeState(attachTypeToApplication(uniqueIdStream())(inputScope)(expression));
    });

    it('emits an error message', () => {
      expect(result.messages).toEqual([
        'Given parameter did not match expected shape',
      ]);
    });

    it('uses the body of the callee type as the expression type', () => {
      expect(result.node.decoration.type).toEqual(booleanLiteral(true));
    });
  });

  describe('when the expected shape is a free variable', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: Application<AttachedTypeNode>

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'Application',
        callee: node(
          {
            kind: 'Identifier',
            name: 'callee',
          },
          {
            scope: inputScope,
            type: functionType(freeVariable('freeVariable'), [freeVariable('freeVariable')]),
          },
        ),
        parameter: node(
          {
            kind: 'NumberExpression',
            value: 7,
          },
          {
            scope: inputScope,
            type: numberLiteral(7),
          },
        ),
      };
      result = deconstructTypeState(attachTypeToApplication(uniqueIdStream())(inputScope)(expression));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('returns the free variable replacement', () => {
      expect(result.replacements).toEqual([{
        from: 'freeVariable',
        to: numberLiteral(7),
      }]);
    });

    it('applies replacements from the parameter to the attached type of the expression', () => {
      expect(result.node.decoration.type).toEqual(numberLiteral(7));
    });
  });

  describe('when the parameter can be merged with the expected shape', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: Application<AttachedTypeNode>

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'Application',
        callee: node(
          {
            kind: 'Identifier',
            name: 'callee',
          },
          {
            scope: inputScope,
            type: functionType(freeVariable('a'), [dataValue('DataValue', [freeVariable('a'), booleanLiteral(true)])]),
          },
        ),
        parameter: node(
          {
            kind: 'Identifier',
            name: 'randomIdentifier',
          },
          {
            scope: inputScope,
            type: dataValue('DataValue', [numberLiteral(7), freeVariable('b')]),
          },
        ),
      };
      result = deconstructTypeState(attachTypeToApplication(uniqueIdStream())(inputScope)(expression));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('returns the free variable replacement', () => {
      expect(result.replacements).toEqual([
        {
          from: 'a',
          to: numberLiteral(7),
        },
        {
          from: 'b',
          to: booleanLiteral(true),
        },
      ]);
    });

    it('applies replacements from the parameter to the attached type of the expression', () => {
      expect(result.node.decoration.type).toEqual(numberLiteral(7));
    });
  });

  describe('when the callee has implicit parameters', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: Application<AttachedTypeNode>

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'Application',
        callee: node(
          {
            kind: 'Identifier',
            name: 'callee',
          },
          {
            scope: inputScope,
            type: functionType(booleanLiteral(true), [
              [dataValue('Int', [freeVariable('a')]), true],
              [freeVariable('otherVariable'), true],
              freeVariable('a'),
            ]),
          },
        ),
        parameter: node(
          {
            kind: 'Identifier',
            name: 'randomIdentifier',
          },
          {
            scope: inputScope,
            type: numberLiteral(7),
          },
        ),
      };
      result = deconstructTypeState(attachTypeToApplication(uniqueIdStream())(inputScope)(expression));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('returns the free variable replacement', () => {
      expect(result.replacements).toEqual([
        {
          from: 'a',
          to: numberLiteral(7),
        },
      ]);
    });

    it('removes implicit parameters from the attached type', () => {
      expect(result.node.decoration.type).toEqual(booleanLiteral(true));
    });
  });

  describe('when the parameter has implicit parameters', () => {
    let result: DeconstructedTypeState;
    let inputScope: Scope;
    let expression: Application<AttachedTypeNode>

    beforeEach(() => {
      inputScope = scope();
      expression = {
        kind: 'Application',
        callee: node(
          {
            kind: 'Identifier',
            name: 'callee',
          },
          {
            scope: inputScope,
            type: functionType(freeVariable('a'), [freeVariable('a')]),
          },
        ),
        parameter: node(
          {
            kind: 'Identifier',
            name: 'randomIdentifier',
          },
          {
            scope: inputScope,
            type: functionType(numberLiteral(7), [
              [booleanLiteral(true), true],
              [freeVariable('p'), true],
            ]),
          },
        ),
      };
      result = deconstructTypeState(attachTypeToApplication(uniqueIdStream())(inputScope)(expression));
    });

    it('returns no messages', () => {
      expect(result.messages).toEqual([]);
    });

    it('removes implicit parameters from the variable replacement', () => {
      expect(result.replacements).toEqual([
        {
          from: 'a',
          to: numberLiteral(7),
        },
      ]);
    });

    it('removes implicit parameters from the attached type', () => {
      expect(result.node.decoration.type).toEqual(numberLiteral(7));
    });
  });
});
